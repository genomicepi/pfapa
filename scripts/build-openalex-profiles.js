#!/usr/bin/env node

/**
 * Build OpenAlex Author & Institution Profiles
 *
 * Creates enriched profile data for all authors and institutions by:
 * 1. Mapping to OpenAlex canonical IDs
 * 2. Fetching full profile data (h-index, citations, works, etc.)
 * 3. Building structured profile files
 *
 * Performance:
 * - With API key: Uses batching (10 concurrent requests) for ~5-10x speedup
 * - Without API key: Conservative batching (5 concurrent) with email auth
 * - Expected time: ~2 min with API key, ~5-10 min without (for 500 papers)
 *
 * Usage:
 *   node scripts/build-openalex-profiles.js
 *   node scripts/build-openalex-profiles.js --max-papers=500
 *
 * Options:
 *   --max-papers=N    Limit to N most recent papers (for faster builds)
 *                     Recommended: 500 for template/large datasets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration from .env or .env.template
function loadConfig() {
  const envPath = path.join(__dirname, '..', '.env');
  const envTemplatePath = path.join(__dirname, '..', '.env.template');
  const configPath = fs.existsSync(envPath) ? envPath : envTemplatePath;

  const content = fs.readFileSync(configPath, 'utf-8');
  const config = {};

  content.split('\n').forEach((line) => {
    if (line.trim().startsWith('#') || !line.trim()) return;
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      config[key.trim()] = valueParts.join('=').trim();
    }
  });

  return config;
}

const config = loadConfig();

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const PAPERS_FILE = path.join(DATA_DIR, 'papers.json');
const AUTHORS_FILE = path.join(DATA_DIR, 'authors.json');
const INSTITUTIONS_FILE = path.join(DATA_DIR, 'institutions.json');

// OpenAlex API
const OPENALEX_API = 'https://api.openalex.org';
const CONTACT_EMAIL = config.OPENALEX_EMAIL || config.CONTACT_EMAIL || 'contact@example.com';
// API keys must come from uncommitted local env or GitHub Actions secrets, never .env.template
const API_KEY = process.env.OPENALEX_API_KEY || '';
const USER_AGENT = `researchnet-template (mailto:${CONTACT_EMAIL})`;

/**
 * Add authentication to OpenAlex URL
 */
function addAuthParams(url) {
  const separator = url.includes('?') ? '&' : '?';
  if (API_KEY) {
    return `${url}${separator}api_key=${API_KEY}`;
  } else {
    return `${url}${separator}mailto=${CONTACT_EMAIL}`;
  }
}

/**
 * Sleep for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch array into chunks
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetch from OpenAlex
 */
async function fetchOpenAlex(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`   ⚠️  Fetch error: ${error.message}`);
    return null;
  }
}

/**
 * Normalize author name for matching
 */
function normalizeAuthorName(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const lastName = parts[0];
  const initials = parts.slice(1).join('');
  const cleanInitials = initials.replace(/[.\s]/g, '');
  const firstInitial = cleanInitials.charAt(0);
  return `${lastName} ${firstInitial}`;
}

function normalizeOrcid(orcid) {
  return (orcid || '').replace('https://orcid.org/', '').trim().toLowerCase();
}

function getAuthorNameKey(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  if (parts.length === 1) {
    return parts[0].toLowerCase();
  }

  const secondPart = parts[1].replace(/[.\s]/g, '');
  const looksLikePubMedFormat = /^[A-Z]+$/.test(secondPart);
  const lastName = looksLikePubMedFormat ? parts[0] : parts[parts.length - 1];
  const firstInitial = looksLikePubMedFormat ? secondPart.charAt(0) : parts[0].charAt(0);

  return `${lastName.toLowerCase()}|${firstInitial.toLowerCase()}`;
}

/**
 * Get OpenAlex work (paper) data
 */
async function getOpenAlexWork(pmid) {
  const url = addAuthParams(`${OPENALEX_API}/works/pmid:${pmid}`);
  return await fetchOpenAlex(url);
}

/**
 * Get OpenAlex author profile
 */
async function getOpenAlexAuthor(authorId) {
  // Remove https://openalex.org/ prefix if present
  const id = authorId.replace('https://openalex.org/', '');
  const url = addAuthParams(`${OPENALEX_API}/authors/${id}`);
  return await fetchOpenAlex(url);
}

/**
 * Get OpenAlex institution profile
 */
async function getOpenAlexInstitution(institutionId) {
  const id = institutionId.replace('https://openalex.org/', '');
  const url = addAuthParams(`${OPENALEX_API}/institutions/${id}`);
  return await fetchOpenAlex(url);
}

/**
 * Build author profiles from papers
 */
async function buildAuthorProfiles(papers) {
  console.log('👥 Building author profiles...\n');

  const authorMap = new Map(); // normalized name -> data
  const authorKeyMap = new Map(); // last name + first initial -> data
  const authorOrcidMap = new Map(); // ORCID -> data
  const openAlexAuthorMap = new Map(); // OpenAlex ID -> full profile

  // Step 1: Collect all authors and their papers
  console.log('   📋 Step 1: Collecting authors from papers...');
  papers.forEach(paper => {
    const authors = paper.authors || [];
    authors.forEach(authorData => {
      const name = typeof authorData === 'string' ? authorData : authorData.name;
      const normalized = normalizeAuthorName(name);

      if (!authorMap.has(normalized)) {
        authorMap.set(normalized, {
          normalizedName: normalized,
          displayName: name,
          variants: new Set([name]),
          papers: [],
          orcid: '',
          openAlexId: null,
          affiliations: new Set()
        });
      }

      const author = authorMap.get(normalized);
      author.variants.add(name);
      author.papers.push(paper.pmid);
      const nameKey = getAuthorNameKey(name);
      if (nameKey) {
        const existingAuthor = authorKeyMap.get(nameKey);
        if (!authorKeyMap.has(nameKey)) {
          authorKeyMap.set(nameKey, author);
        } else if (existingAuthor !== author) {
          authorKeyMap.set(nameKey, null);
        }
      }

      if (typeof authorData === 'object') {
        if (authorData.orcid && !author.orcid) {
          author.orcid = normalizeOrcid(authorData.orcid);
        }
        if (author.orcid && !authorOrcidMap.has(author.orcid)) {
          authorOrcidMap.set(author.orcid, author);
        }
        if (authorData.affiliations) {
          authorData.affiliations.forEach(aff => author.affiliations.add(aff));
        }
      }
    });
  });

  console.log(`   ✓ Found ${authorMap.size} unique authors\n`);

  // Step 2: Map to OpenAlex IDs
  console.log('   🔍 Step 2: Mapping to OpenAlex author IDs...');
  const batchSize = API_KEY ? 10 : 5; // With API key, do 10 concurrent requests
  const delayMs = API_KEY ? 50 : 100; // Faster with API key
  let mapped = 0;
  let processed = 0;
  const totalPapers = papers.length;

  // Process papers in batches
  const batches = chunk(papers, batchSize);
  for (const batch of batches) {
    const batchPromises = batch.map(async (paper) => {
      const workData = await getOpenAlexWork(paper.pmid);
      if (!workData || !workData.authorships) return;

      // Match authorships to our authors
      const ourAuthors = paper.authors || [];
      workData.authorships.forEach((authorship, idx) => {
        if (!authorship.author) return;

        const openAlexName = authorship.author.display_name || '';
        const openAlexNameKey = getAuthorNameKey(openAlexName);
        const openAlexOrcid = normalizeOrcid(authorship.author.orcid);
        let author = openAlexOrcid ? authorOrcidMap.get(openAlexOrcid) : null;

        if (!author && openAlexNameKey) {
          author = authorKeyMap.get(openAlexNameKey);
        }

        if (!author) {
          const ourAuthor = ourAuthors[idx];
          if (!ourAuthor) return;

          const localName = typeof ourAuthor === 'string' ? ourAuthor : ourAuthor.name;
          const localNameKey = getAuthorNameKey(localName);

          // Positional fallback is only safe when the names are compatible.
          if (localNameKey && localNameKey === openAlexNameKey) {
            author = authorMap.get(normalizeAuthorName(localName));
          }
        }

        if (author && !author.openAlexId) {
          author.openAlexId = authorship.author.id;
          mapped++;
        }
      });
    });

    await Promise.all(batchPromises);
    processed += batch.length;
    process.stdout.write(`\r      Progress: ${processed}/${totalPapers} papers`);

    if (delayMs > 0) await sleep(delayMs);
  }

  console.log(`\n   ✓ Mapped ${mapped} authors to OpenAlex IDs\n`);

  // Step 3: Fetch full profiles for mapped authors
  console.log('   📊 Step 3: Fetching author profiles from OpenAlex...');
  let profilesFetched = 0;

  const authorsWithIds = Array.from(authorMap.values()).filter(a => a.openAlexId);
  const totalAuthors = authorsWithIds.length;

  const authorBatches = chunk(authorsWithIds, batchSize);
  for (const batch of authorBatches) {
    const batchPromises = batch.map(async (author) => {
      const profile = await getOpenAlexAuthor(author.openAlexId);
      if (profile) {
        openAlexAuthorMap.set(author.openAlexId, profile);
        profilesFetched++;
      }
    });

    await Promise.all(batchPromises);
    process.stdout.write(`\r      Profiles fetched: ${profilesFetched}/${totalAuthors}`);

    if (delayMs > 0) await sleep(delayMs);
  }

  console.log(`\n   ✓ Fetched ${profilesFetched} author profiles\n`);

  // Step 4: Build final author objects
  const authors = Array.from(authorMap.values()).map(author => {
    const profile = author.openAlexId ? openAlexAuthorMap.get(author.openAlexId) : null;

    return {
      id: author.openAlexId || `local-${author.normalizedName.replace(/\s+/g, '-').toLowerCase()}`,
      name: author.displayName,
      normalizedName: author.normalizedName,
      variants: Array.from(author.variants),
      orcid: author.orcid || profile?.orcid?.replace('https://orcid.org/', '') || '',

      // Stats
      worksCount: profile?.works_count || author.papers.length,
      citedByCount: profile?.cited_by_count || 0,
      hIndex: profile?.summary_stats?.h_index || 0,
      i10Index: profile?.summary_stats?.i10_index || 0,

      // Papers in our dataset
      conditionPapers: author.papers,
      conditionPapersCount: author.papers.length,

      // Affiliations
      currentAffiliation: profile?.last_known_institutions?.[0]?.display_name || '',
      currentInstitutionId: profile?.last_known_institutions?.[0]?.id || '',
      affiliationHistory: Array.from(author.affiliations),

      // Concepts/topics
      topics: profile?.topics?.slice(0, 10).map(t => ({
        name: t.display_name,
        count: t.count,
        id: t.id
      })) || [],

      // Links
      openAlexUrl: author.openAlexId || '',
      orcidUrl: author.orcid ? `https://orcid.org/${author.orcid}` : '',

      // Last updated
      updatedDate: profile?.updated_date || new Date().toISOString().split('T')[0]
    };
  });

  // Sort by condition-specific paper count
  authors.sort((a, b) => b.conditionPapersCount - a.conditionPapersCount);

  return authors;
}

/**
 * Build institution profiles
 */
async function buildInstitutionProfiles(papers) {
  console.log('🏛️  Building institution profiles...\n');

  const institutionMap = new Map(); // normalized name -> data
  const openAlexInstitutionMap = new Map(); // OpenAlex ID -> full profile

  // Step 1: Collect all institutions
  console.log('   📋 Step 1: Collecting institutions from papers...');

  const batchSize = API_KEY ? 10 : 5;
  const delayMs = API_KEY ? 50 : 100;
  let processed = 0;
  const totalPapers = papers.length;

  const paperBatches = chunk(papers, batchSize);
  for (const batch of paperBatches) {
    const batchPromises = batch.map(async (paper) => {
      const workData = await getOpenAlexWork(paper.pmid);
      if (!workData || !workData.authorships) return;

      workData.authorships.forEach(authorship => {
        if (!authorship.institutions) return;

        authorship.institutions.forEach(inst => {
          if (!inst.id || !inst.display_name) return;

          if (!institutionMap.has(inst.id)) {
            institutionMap.set(inst.id, {
              id: inst.id,
              name: inst.display_name,
              papers: new Set(),
              authors: new Set()
            });
          }

          const institution = institutionMap.get(inst.id);
          institution.papers.add(paper.pmid);
        });
      });
    });

    await Promise.all(batchPromises);
    processed += batch.length;
    process.stdout.write(`\r      Progress: ${processed}/${totalPapers} papers`);

    if (delayMs > 0) await sleep(delayMs);
  }

  console.log(`\n   ✓ Found ${institutionMap.size} unique institutions\n`);

  // Step 2: Fetch full profiles
  console.log('   📊 Step 2: Fetching institution profiles...');
  let profilesFetched = 0;

  const instEntries = Array.from(institutionMap.entries());
  const totalInstitutions = instEntries.length;

  const instBatches = chunk(instEntries, batchSize);
  for (const batch of instBatches) {
    const batchPromises = batch.map(async ([instId]) => {
      const profile = await getOpenAlexInstitution(instId);
      if (profile) {
        openAlexInstitutionMap.set(instId, profile);
        profilesFetched++;
      }
    });

    await Promise.all(batchPromises);
    process.stdout.write(`\r      Profiles fetched: ${profilesFetched}/${totalInstitutions}`);

    if (delayMs > 0) await sleep(delayMs);
  }

  console.log(`\n   ✓ Fetched ${profilesFetched} institution profiles\n`);

  // Step 3: Build final institution objects
  const institutions = Array.from(institutionMap.entries()).map(([id, data]) => {
    const profile = openAlexInstitutionMap.get(id);

    return {
      id: id.replace('https://openalex.org/', ''),
      name: data.name,

      // Stats
      worksCount: profile?.works_count || 0,
      citedByCount: profile?.cited_by_count || 0,

      // Papers in our dataset
      conditionPapers: Array.from(data.papers),
      conditionPapersCount: data.papers.size,

      // Geographic
      city: profile?.geo?.city || '',
      region: profile?.geo?.region || '',
      country: profile?.geo?.country || '',
      countryCode: profile?.geo?.country_code || '',
      latitude: profile?.geo?.latitude || null,
      longitude: profile?.geo?.longitude || null,

      // Type & info
      type: profile?.type || '',
      homepage: profile?.homepage_url || '',
      imageUrl: profile?.image_url || '',

      // Associated
      associatedInstitutions: profile?.associated_institutions?.slice(0, 5).map(i => ({
        id: i.id,
        name: i.display_name,
        relationship: i.relationship
      })) || [],

      // Links
      openAlexUrl: id,
      wikipediaUrl: profile?.ids?.wikipedia || '',

      // Last updated
      updatedDate: profile?.updated_date || new Date().toISOString().split('T')[0]
    };
  });

  // Sort by condition-specific paper count
  institutions.sort((a, b) => b.conditionPapersCount - a.conditionPapersCount);

  return institutions;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Building OpenAlex Profiles\n');
  console.log(`   Condition: ${config.CONDITION_DISPLAY_NAME || config.CONDITION_NAME || 'condition'}`);
  if (API_KEY) {
    console.log(`   🔑 Using API key authentication (faster rate limits)`);
  } else {
    console.log(`   📧 Using email authentication (mailto:${CONTACT_EMAIL})`);
    console.log(`   💡 Tip: Get a free API key at https://openalex.org/ for 5-10x faster builds`);
  }
  console.log('================================================\n');

  // Check if profiles are enabled
  const enableProfiles = config.ENABLE_RESEARCHER_PROFILES !== 'false';
  if (!enableProfiles) {
    console.log('ℹ️  Researcher profiles disabled in config (ENABLE_RESEARCHER_PROFILES=false)');
    console.log('   Creating empty profile files...\n');
    fs.writeFileSync(AUTHORS_FILE, JSON.stringify([], null, 2));
    fs.writeFileSync(INSTITUTIONS_FILE, JSON.stringify([], null, 2));
    console.log('✅ Done\n');
    return;
  }

  // Parse command line args
  const args = process.argv.slice(2);
  const maxPapersArg = args.find(arg => arg.startsWith('--max-papers='));
  const configMaxPapers = parseInt(config.MAX_PAPERS_FOR_PROFILES || '500');
  const maxPapers = maxPapersArg ? parseInt(maxPapersArg.split('=')[1]) : configMaxPapers;

  // Load papers
  console.log('📖 Loading papers...');
  let papers = JSON.parse(fs.readFileSync(PAPERS_FILE, 'utf-8'));
  const totalPapers = papers.length;

  // Limit to most recent papers if specified
  if (maxPapers && papers.length > maxPapers) {
    console.log(`   ⚡ Limiting to ${maxPapers} most recent papers (out of ${totalPapers})`);
    // Sort by date descending (newest first)
    papers.sort((a, b) => {
      const dateA = new Date(a.pubDate || '2000-01-01');
      const dateB = new Date(b.pubDate || '2000-01-01');
      return dateB - dateA;
    });
    papers = papers.slice(0, maxPapers);
    console.log(`   ✓ Using ${papers.length} papers from ${papers[papers.length - 1].pubDate} to ${papers[0].pubDate}\n`);
  } else {
    console.log(`   ✓ Loaded ${papers.length} papers\n`);
  }

  // Build author profiles
  const authors = await buildAuthorProfiles(papers);
  console.log(`✅ Built ${authors.length} author profiles\n`);

  // Build institution profiles
  const institutions = await buildInstitutionProfiles(papers);
  console.log(`✅ Built ${institutions.length} institution profiles\n`);

  // Save
  console.log('💾 Saving data...');
  fs.writeFileSync(AUTHORS_FILE, JSON.stringify(authors, null, 2));
  console.log(`   ✓ Saved authors to ${AUTHORS_FILE}`);

  fs.writeFileSync(INSTITUTIONS_FILE, JSON.stringify(institutions, null, 2));
  console.log(`   ✓ Saved institutions to ${INSTITUTIONS_FILE}\n`);

  // Summary
  console.log('================================================');
  console.log('📊 SUMMARY\n');
  console.log(`Authors: ${authors.length}`);
  console.log(`  - With OpenAlex IDs: ${authors.filter(a => a.openAlexUrl).length}`);
  console.log(`  - With ORCID: ${authors.filter(a => a.orcid).length}`);
  console.log(`  - With h-index: ${authors.filter(a => a.hIndex > 0).length}\n`);

  console.log(`Institutions: ${institutions.length}`);
  console.log(`  - With geographic data: ${institutions.filter(i => i.country).length}`);
  console.log(`  - With homepages: ${institutions.filter(i => i.homepage).length}\n`);

  console.log('✅ Profile building complete!');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
