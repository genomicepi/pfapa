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

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';
const CONDITION = config.CLINICALTRIALS_CONDITION || 'condition';
const PAGE_SIZE = 100; // Max results per page
const MAX_TRIALS = parseInt(config.MAX_CLINICAL_TRIALS || '500');
const OUTPUT_FILE = path.join(__dirname, '../src/data/clinical-trials.json');

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch trials from ClinicalTrials.gov API
 */
async function fetchTrials(pageToken = null) {
  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({
    'query.cond': CONDITION,
    pageSize: PAGE_SIZE.toString(),
    format: 'json',
  }).toString();

  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }

  console.log(`Fetching: ${url.toString()}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Extract relevant data from a trial
 */
function extractTrialData(study) {
  const protocol = study.protocolSection || {};
  const identification = protocol.identificationModule || {};
  const status = protocol.statusModule || {};
  const description = protocol.descriptionModule || {};
  const design = protocol.designModule || {};
  const contactsLocations = protocol.contactsLocationsModule || {};
  const sponsor = protocol.sponsorCollaboratorsModule || {};
  const armsInterventions = protocol.armsInterventionsModule || {};

  // Extract locations
  const locations = (contactsLocations.locations || []).map(loc => ({
    facility: loc.facility,
    city: loc.city,
    state: loc.state,
    country: loc.country,
    geoPoint: loc.geoPoint
  }));

  // Extract interventions
  const interventions = (armsInterventions.interventions || []).map(int => ({
    type: int.type,
    name: int.name,
    description: int.description
  }));

  return {
    nctId: identification.nctId,
    briefTitle: identification.briefTitle,
    officialTitle: identification.officialTitle,
    status: status.overallStatus,
    statusVerifiedDate: status.statusVerifiedDate,
    studyType: design.studyType,
    phases: design.phases || [],
    briefSummary: description.briefSummary,
    detailedDescription: description.detailedDescription,
    conditions: protocol.conditionsModule?.conditions || [],
    startDate: status.startDateStruct?.date,
    completionDate: status.completionDateStruct?.date,
    primaryCompletionDate: status.primaryCompletionDateStruct?.date,
    enrollment: design.enrollmentInfo?.count,
    enrollmentType: design.enrollmentInfo?.type,
    sponsor: sponsor.leadSponsor?.name,
    sponsorClass: sponsor.leadSponsor?.class,
    locations: locations,
    interventions: interventions,
    hasResults: study.hasResults || false,
    url: `https://clinicaltrials.gov/study/${identification.nctId}`
  };
}

/**
 * Main function
 */
async function main() {
  console.log(`🔬 Fetching clinical trials for: ${config.CONDITION_DISPLAY_NAME || CONDITION}\n`);

  if (!CONDITION) {
    console.error('❌ Error: CLINICALTRIALS_CONDITION not configured in .env.template');
    process.exit(1);
  }

  let allTrials = [];
  let pageToken = null;
  let pageCount = 0;

  do {
    const data = await fetchTrials(pageToken);

    if (data.studies && data.studies.length > 0) {
      const extractedTrials = data.studies.map(extractTrialData);
      allTrials = allTrials.concat(extractedTrials);
      console.log(`   Fetched page ${++pageCount}: ${data.studies.length} trials (total: ${allTrials.length})`);

      // Safety check: abort if too many trials
      if (allTrials.length > MAX_TRIALS) {
        console.error(`\n❌ Error: Found ${allTrials.length}+ trials, but MAX_CLINICAL_TRIALS is set to ${MAX_TRIALS}`);
        console.error(`   Consider increasing MAX_CLINICAL_TRIALS in .env.template`);
        process.exit(1);
      }
    }

    pageToken = data.nextPageToken;

    // Be polite to the API - wait 200ms between requests
    if (pageToken) {
      await sleep(200);
    }

  } while (pageToken);

  // Sort by start date (most recent first)
  allTrials.sort((a, b) => {
    const dateA = a.startDate || '0000-00-00';
    const dateB = b.startDate || '0000-00-00';
    return dateB.localeCompare(dateA);
  });

  // Save to file
  const outputData = {
    lastUpdated: new Date().toISOString(),
    totalTrials: allTrials.length,
    trials: allTrials
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));

  console.log(`\n✓ Successfully fetched ${allTrials.length} clinical trials`);
  console.log(`✓ Saved to: ${OUTPUT_FILE}`);

  // Print summary
  const statusCounts = {};
  allTrials.forEach(trial => {
    statusCounts[trial.status] = (statusCounts[trial.status] || 0) + 1;
  });

  console.log('\nStatus breakdown:');
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
