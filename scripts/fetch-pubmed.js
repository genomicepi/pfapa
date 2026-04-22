#!/usr/bin/env node

/**
 * Fetch Research Papers from PubMed
 *
 * Searches PubMed for papers matching configured condition and caches to JSON.
 * Supports both historical seeding and incremental updates.
 *
 * Usage:
 *   node scripts/fetch-pubmed.js                # Fetch last 7 days (incremental)
 *   node scripts/fetch-pubmed.js --seed         # Fetch from configured start year
 *   node scripts/fetch-pubmed.js --years=5      # Fetch last 5 years
 *   node scripts/fetch-pubmed.js --from-year=2000  # Fetch from 2000 onwards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(parseString);

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

// PubMed E-utilities endpoints
const ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

// API configuration
const API_KEY = process.env.PUBMED_API_KEY || '';
const EMAIL = config.CONTACT_EMAIL || 'contact@example.com'; // NCBI requires email for tracking
const CONDITION_NAME = config.CONDITION_NAME || 'condition';
const PUBMED_QUERY = config.PUBMED_SEARCH_QUERY || '';
const PUBMED_START_YEAR = parseInt(config.PUBMED_START_YEAR || '2000');
const MAX_PAPERS = parseInt(config.MAX_PAPERS_TOTAL || '5000');

// Output path
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const PAPERS_FILE = path.join(DATA_DIR, 'papers.json');

// Parse command line args
const args = process.argv.slice(2);
const isSeedMode = args.includes('--seed');
const yearsArg = args.find(arg => arg.startsWith('--years'));
const fromYearArg = args.find(arg => arg.startsWith('--from-year'));

let yearsCount = 0;
let fromYear = null;

if (fromYearArg) {
  fromYear = parseInt(fromYearArg.split('=')[1]);
} else if (yearsArg) {
  yearsCount = parseInt(yearsArg.split('=')[1]);
}

/**
 * Sleep for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch from URL with error handling
 */
async function fetchUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Search PubMed for PMIDs
 */
async function searchPubMed(query, retmax = 100, retstart = 0) {
  console.log(`🔍 Searching PubMed: ${query}`);

  const params = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: retmax.toString(),
    retstart: retstart.toString(),
    retmode: 'xml',
    tool: 'researchnet-template',
    email: EMAIL,
  });

  if (API_KEY) {
    params.append('api_key', API_KEY);
  }

  const url = `${ESEARCH_URL}?${params}`;
  const xml = await fetchUrl(url);
  const result = await parseXml(xml);

  const count = parseInt(result.eSearchResult.Count[0]);
  const pmids = result.eSearchResult.IdList[0].Id || [];

  console.log(`   Found ${count} total papers, retrieved ${pmids.length} PMIDs from offset ${retstart}`);

  return { count, pmids };
}

/**
 * Search PubMed and page through all PMIDs up to the configured safety limit.
 */
async function searchAllPubMedPmids(query, maxPapers, pageSize = 1000) {
  const firstPage = await searchPubMed(query, pageSize, 0);

  if (firstPage.count > maxPapers) {
    console.error(`❌ Error: Found ${firstPage.count} papers, but MAX_PAPERS_TOTAL is set to ${maxPapers}`);
    console.error(`   Consider:
   - Narrowing your PUBMED_SEARCH_QUERY
   - Increasing PUBMED_START_YEAR
   - Increasing MAX_PAPERS_TOTAL (may cause slow builds)`);
    process.exit(1);
  }

  const allPmids = [...firstPage.pmids];

  for (let retstart = allPmids.length; retstart < firstPage.count; retstart += pageSize) {
    await sleep(API_KEY ? 100 : 350);
    const page = await searchPubMed(query, pageSize, retstart);
    allPmids.push(...page.pmids);
  }

  return { count: firstPage.count, pmids: allPmids };
}

/**
 * Fetch paper details from PubMed (in batches to avoid URL length limits)
 */
async function fetchPaperDetails(pmids) {
  if (pmids.length === 0) return [];

  console.log(`📥 Fetching details for ${pmids.length} papers...`);

  const BATCH_SIZE = 100;
  const allPapers = [];

  for (let i = 0; i < pmids.length; i += BATCH_SIZE) {
    const batch = pmids.slice(i, i + BATCH_SIZE);
    console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pmids.length / BATCH_SIZE)}: ${batch.length} papers`);

    const params = new URLSearchParams({
      db: 'pubmed',
      id: batch.join(','),
      retmode: 'xml',
      rettype: 'abstract',
      tool: 'researchnet-template',
      email: EMAIL,
    });

    if (API_KEY) {
      params.append('api_key', API_KEY);
    }

    const url = `${EFETCH_URL}?${params}`;
    const xml = await fetchUrl(url);
    const result = await parseXml(xml);

    const articles = result.PubmedArticleSet?.PubmedArticle || [];

    for (const article of articles) {
      try {
        const medlineCitation = article.MedlineCitation[0];
        const pubmedData = article.PubmedData[0];
        const articleData = medlineCitation.Article[0];

        const pmid = medlineCitation.PMID[0]._;

        // Extract title (handle both string and complex object formats)
        let title = '';
        const titleData = articleData.ArticleTitle[0];
        if (typeof titleData === 'string') {
          title = titleData;
        } else if (titleData._) {
          // Complex format with nested tags
          title = titleData._;
        } else {
          title = JSON.stringify(titleData);
        }

        // Extract authors with affiliations and ORCIDs
        const authorList = articleData.AuthorList?.[0]?.Author || [];
        const authors = authorList.map(author => {
          const lastName = author.LastName?.[0] || '';
          const initials = author.Initials?.[0] || '';
          const name = lastName && initials ? `${lastName} ${initials}` : lastName;

          // Extract affiliations
          const affiliationList = author.AffiliationInfo || [];
          const affiliations = affiliationList.map(aff => aff.Affiliation?.[0] || '').filter(Boolean);

          // Extract ORCID
          const identifiers = author.Identifier || [];
          const orcidEntry = identifiers.find(id => id.$.Source === 'ORCID');
          const orcid = orcidEntry?._ || '';

          return name ? {
            name,
            affiliations,
            orcid
          } : null;
        }).filter(Boolean);

        // Extract journal
        const journal = articleData.Journal?.[0]?.Title?.[0] || 'Unknown Journal';

        // Extract publication date
        const pubDate = medlineCitation.Article[0].Journal[0].JournalIssue[0].PubDate[0];
        const year = pubDate.Year?.[0] || '';
        const month = pubDate.Month?.[0] || '01';
        const day = pubDate.Day?.[0] || '01';
        const pubDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Extract abstract
        const abstractTexts = articleData.Abstract?.[0]?.AbstractText || [];
        const abstract = abstractTexts.map(text => {
          if (typeof text === 'string') return text;
          if (text._) return text._;
          return '';
        }).join(' ').trim();

        // Extract MeSH terms
        const meshHeadingList = medlineCitation.MeshHeadingList?.[0]?.MeshHeading || [];
        const meshTerms = meshHeadingList.map(heading => {
          return heading.DescriptorName?.[0]?._ || '';
        }).filter(Boolean);

        // Extract DOI
        const articleIds = pubmedData.ArticleIdList?.[0]?.ArticleId || [];
        const doiEntry = articleIds.find(id => id.$.IdType === 'doi');
        const doi = doiEntry?._ || '';

        allPapers.push({
          pmid,
          title,
          authors,
          journal,
          pubDate: pubDateStr,
          abstract: abstract || 'No abstract available',
          meshTerms,
          doi,
          pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        });

      } catch (err) {
        console.warn(`   ⚠️  Error parsing article: ${err.message}`);
      }
    }

    // Rate limiting between batches
    if (i + BATCH_SIZE < pmids.length) {
      await sleep(API_KEY ? 100 : 350);
    }
  }

  console.log(`   ✅ Parsed ${allPapers.length} papers`);
  return allPapers;
}

/**
 * Load existing papers from JSON
 */
function loadExistingPapers() {
  if (!fs.existsSync(PAPERS_FILE)) {
    return [];
  }

  const json = fs.readFileSync(PAPERS_FILE, 'utf-8');
  return JSON.parse(json);
}

/**
 * Save papers to JSON
 */
function savePapers(papers) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(PAPERS_FILE, JSON.stringify(papers, null, 2));
  console.log(`💾 Saved ${papers.length} papers to ${PAPERS_FILE}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 PubMed Fetch Started\n');
  console.log(`   Condition: ${config.CONDITION_DISPLAY_NAME || CONDITION_NAME}`);
  console.log(`   Query: ${PUBMED_QUERY}\n`);

  if (!PUBMED_QUERY) {
    console.error('❌ Error: PUBMED_SEARCH_QUERY not configured in .env.template');
    process.exit(1);
  }

  // Build search query with date range
  let query = `(${PUBMED_QUERY})`;

  if (fromYear) {
    console.log(`📅 Mode: Historical seed (from ${fromYear} onwards)\n`);
    query += ` AND ${fromYear}:3000[PDAT]`;
  } else if (yearsCount > 0) {
    console.log(`📅 Mode: Historical seed (last ${yearsCount} years)\n`);
    const startYear = new Date().getFullYear() - yearsCount;
    query += ` AND ${startYear}:3000[PDAT]`;
  } else if (isSeedMode) {
    console.log(`📅 Mode: Historical seed (from ${PUBMED_START_YEAR} onwards)\n`);
    query += ` AND ${PUBMED_START_YEAR}:3000[PDAT]`;
  } else {
    console.log(`📅 Mode: Incremental update (last 7 days)\n`);
    query += ' AND ("last 7 days"[PDat])';
  }

  try {
    // Step 1: Search for PMIDs
    const pageSize = (fromYear || yearsCount > 0 || isSeedMode) ? 1000 : 100;
    const { pmids } = await searchAllPubMedPmids(query, MAX_PAPERS, pageSize);

    if (pmids.length === 0) {
      console.log('\n✨ No new papers found');
      return;
    }

    // Rate limiting between API calls
    await sleep(API_KEY ? 100 : 350); // 10 req/sec with key, 3 req/sec without

    // Step 2: Fetch paper details
    const newPapers = await fetchPaperDetails(pmids);

    // Step 3: Load existing papers and merge
    const existingPapers = loadExistingPapers();
    const existingPmids = new Set(existingPapers.map(p => p.pmid));

    // Filter out duplicates
    const uniqueNewPapers = newPapers.filter(p => !existingPmids.has(p.pmid));

    if (uniqueNewPapers.length === 0) {
      console.log('\n✨ No new unique papers (all already in database)');
      return;
    }

    // Merge and sort by date (newest first)
    const allPapers = [...existingPapers, ...uniqueNewPapers].sort((a, b) => {
      return b.pubDate.localeCompare(a.pubDate);
    });

    // Step 4: Save to JSON
    savePapers(allPapers);

    console.log(`\n✅ Added ${uniqueNewPapers.length} new papers`);
    console.log(`📊 Total papers in database: ${allPapers.length}`);

    // Print summary of new papers
    console.log('\n📝 New papers added:');
    uniqueNewPapers.slice(0, 5).forEach(paper => {
      console.log(`   • ${paper.title.substring(0, 80)}${paper.title.length > 80 ? '...' : ''}`);
      const authorNames = paper.authors.slice(0, 3).map(author => typeof author === 'string' ? author : author.name);
      console.log(`     ${authorNames.join(', ')} - ${paper.journal} (${paper.pubDate})`);
    });

    if (uniqueNewPapers.length > 5) {
      console.log(`   ... and ${uniqueNewPapers.length - 5} more`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
