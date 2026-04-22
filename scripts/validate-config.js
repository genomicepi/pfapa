#!/usr/bin/env node

/**
 * Configuration Validation Script
 *
 * Validates .env.template configuration before build
 * Run with: npm run validate-config
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.template
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const config = {};

    content.split('\n').forEach((line) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;

      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    });

    return config;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Validation rules
function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // Required fields
  const required = [
    'CONDITION_NAME',
    'CONDITION_DISPLAY_NAME',
    'CONDITION_SHORT_DESCRIPTION',
    'PUBMED_SEARCH_QUERY',
  ];

  required.forEach((field) => {
    if (!config[field] || config[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  });

  // Validate CONDITION_NAME (must be lowercase, no spaces)
  if (config.CONDITION_NAME) {
    if (config.CONDITION_NAME !== config.CONDITION_NAME.toLowerCase()) {
      errors.push('CONDITION_NAME must be lowercase');
    }
    if (config.CONDITION_NAME.includes(' ')) {
      errors.push('CONDITION_NAME cannot contain spaces (use hyphens)');
    }
  }

  // Validate URL format
  if (config.SITE_URL) {
    if (!config.SITE_URL.startsWith('http://') && !config.SITE_URL.startsWith('https://')) {
      errors.push('SITE_URL must start with http:// or https://');
    }
    if (config.SITE_URL.includes('yourusername') || config.SITE_URL.includes('your-repo-name')) {
      warnings.push('SITE_URL contains placeholder values - update with your actual URL');
    }
  }

  // Validate email format
  if (config.CONTACT_EMAIL) {
    if (!config.CONTACT_EMAIL.includes('@')) {
      errors.push('CONTACT_EMAIL must be a valid email address');
    }
    if (config.CONTACT_EMAIL.includes('example.com')) {
      warnings.push('CONTACT_EMAIL contains placeholder - update with your actual email');
    }
  }

  if (config.OPENALEX_API_KEY && config.OPENALEX_API_KEY.trim() !== '') {
    warnings.push('OPENALEX_API_KEY should not be stored in .env.template. Use local .env or a GitHub Actions secret instead.');
  }

  // Validate year
  const currentYear = new Date().getFullYear();
  const startYear = parseInt(config.PUBMED_START_YEAR, 10);
  if (isNaN(startYear) || startYear < 1900 || startYear > currentYear) {
    errors.push(`PUBMED_START_YEAR must be between 1900 and ${currentYear}`);
  }

  // Validate numeric limits
  const maxPapersTotal = parseInt(config.MAX_PAPERS_TOTAL, 10);
  if (isNaN(maxPapersTotal) || maxPapersTotal < 1) {
    errors.push('MAX_PAPERS_TOTAL must be a positive number');
  }

  const maxPapersForProfiles = parseInt(config.MAX_PAPERS_FOR_PROFILES, 10);
  if (isNaN(maxPapersForProfiles) || maxPapersForProfiles < 1) {
    errors.push('MAX_PAPERS_FOR_PROFILES must be a positive number');
  }

  const maxClinicalTrials = parseInt(config.MAX_CLINICAL_TRIALS, 10);
  if (isNaN(maxClinicalTrials) || maxClinicalTrials < 1) {
    errors.push('MAX_CLINICAL_TRIALS must be a positive number');
  }

  // Validate boolean fields
  const booleanFields = [
    'ENABLE_RESEARCHER_PROFILES',
    'ENABLE_INSTITUTION_MAP',
    'ENABLE_TREATMENT_PIPELINE',
    'DEBUG_MODE',
  ];

  booleanFields.forEach((field) => {
    if (config[field] && config[field] !== 'true' && config[field] !== 'false') {
      errors.push(`${field} must be 'true' or 'false'`);
    }
  });

  // Validate Bootswatch theme
  const validThemes = [
    'cerulean', 'cosmo', 'cyborg', 'darkly', 'flatly', 'journal', 'litera', 'lumen',
    'lux', 'materia', 'minty', 'morph', 'pulse', 'quartz', 'sandstone', 'simplex',
    'sketchy', 'slate', 'solar', 'spacelab', 'superhero', 'united', 'vapor', 'yeti', 'zephyr'
  ];

  if (config.BOOTSWATCH_THEME && !validThemes.includes(config.BOOTSWATCH_THEME.toLowerCase())) {
    warnings.push(`BOOTSWATCH_THEME '${config.BOOTSWATCH_THEME}' is not a known theme. Valid themes: ${validThemes.join(', ')}`);
  }

  // Performance warnings
  if (maxPapersForProfiles > 1000) {
    warnings.push('MAX_PAPERS_FOR_PROFILES > 1000 may cause slow builds. Consider reducing to 500-1000.');
  }

  if (maxPapersTotal > 10000) {
    warnings.push('MAX_PAPERS_TOTAL > 10000 may cause very slow builds. Consider filtering by date range.');
  }

  return { errors, warnings };
}

// Main execution
function main() {
  console.log('🔍 Validating configuration...\n');

  const envPath = join(__dirname, '..', '.env.template');
  const config = loadEnvFile(envPath);

  const { errors, warnings } = validateConfig(config);

  // Display results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Configuration is valid!\n');
    console.log('Summary:');
    console.log(`  Condition: ${config.CONDITION_DISPLAY_NAME}`);
    console.log(`  PubMed query: ${config.PUBMED_SEARCH_QUERY}`);
    console.log(`  Start year: ${config.PUBMED_START_YEAR}`);
    console.log(`  Theme: ${config.BOOTSWATCH_THEME}`);
    console.log(`  Researcher profiles: ${config.ENABLE_RESEARCHER_PROFILES}`);
    console.log(`  Institution map: ${config.ENABLE_INSTITUTION_MAP}`);
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log('❌ Configuration errors:\n');
    errors.forEach((error) => console.log(`  • ${error}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  Configuration warnings:\n');
    warnings.forEach((warning) => console.log(`  • ${warning}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('Please fix the errors in .env.template and try again.\n');
    process.exit(1);
  } else {
    console.log('✅ Configuration is valid (with warnings)\n');
    process.exit(0);
  }
}

main();
