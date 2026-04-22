/**
 * Site Configuration Loader
 *
 * Loads configuration from .env.template (or .env for local dev)
 * and provides typed access to all site settings.
 */

// Helper to get environment variable with fallback
function getEnv(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || process.env[key] || defaultValue;
}

// Helper to get boolean environment variable
function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = getEnv(key, String(defaultValue));
  return value === 'true' || value === '1';
}

// Helper to get number environment variable
function getNumberEnv(key: string, defaultValue: number = 0): number {
  const value = getEnv(key, String(defaultValue));
  return parseInt(value, 10) || defaultValue;
}

export interface SiteConfig {
  // Basic Information
  conditionName: string;
  conditionDisplayName: string;
  conditionShortDescription: string;
  siteUrl: string;
  contactEmail: string;

  // Search Queries
  pubmedSearchQuery: string;
  pubmedStartYear: number;
  clinicalTrialsCondition: string;

  // Features
  enableResearcherProfiles: boolean;
  enableInstitutionMap: boolean;
  maxPapersForProfiles: number;

  // Styling
  bootswatchTheme: string;

  // Analytics
  plausibleDomain: string;
  googleAnalyticsId: string;

  // Build Limits
  maxPapersTotal: number;
  maxClinicalTrials: number;
  buildTimeoutMinutes: number;

  // Advanced
  openAlexEmail: string;
  debugMode: boolean;
  apiCacheHours: number;
}

// Load and export configuration
export const siteConfig: SiteConfig = {
  // Basic Information
  conditionName: getEnv('CONDITION_NAME', 'your-condition'),
  conditionDisplayName: getEnv('CONDITION_DISPLAY_NAME', 'Your Condition Name'),
  conditionShortDescription: getEnv(
    'CONDITION_SHORT_DESCRIPTION',
    'A brief description of your medical condition for search engines and social media'
  ),
  siteUrl: getEnv('SITE_URL', 'https://yourusername.github.io/your-repo-name/'),
  contactEmail: getEnv('CONTACT_EMAIL', 'contact@example.com'),

  // Search Queries
  pubmedSearchQuery: getEnv('PUBMED_SEARCH_QUERY', 'your condition OR "alternative name"'),
  pubmedStartYear: getNumberEnv('PUBMED_START_YEAR', 2000),
  clinicalTrialsCondition: getEnv('CLINICALTRIALS_CONDITION', 'your condition'),

  // Features
  enableResearcherProfiles: getBoolEnv('ENABLE_RESEARCHER_PROFILES', true),
  enableInstitutionMap: getBoolEnv('ENABLE_INSTITUTION_MAP', true),
  maxPapersForProfiles: getNumberEnv('MAX_PAPERS_FOR_PROFILES', 500),

  // Styling
  bootswatchTheme: getEnv('BOOTSWATCH_THEME', 'cosmo'),

  // Analytics
  plausibleDomain: getEnv('PLAUSIBLE_DOMAIN', ''),
  googleAnalyticsId: getEnv('GOOGLE_ANALYTICS_ID', ''),

  // Build Limits
  maxPapersTotal: getNumberEnv('MAX_PAPERS_TOTAL', 5000),
  maxClinicalTrials: getNumberEnv('MAX_CLINICAL_TRIALS', 500),
  buildTimeoutMinutes: getNumberEnv('BUILD_TIMEOUT_MINUTES', 30),

  // Advanced
  openAlexEmail: getEnv('OPENALEX_EMAIL', ''),
  debugMode: getBoolEnv('DEBUG_MODE', false),
  apiCacheHours: getNumberEnv('API_CACHE_HOURS', 24),
};

// Export individual configs for convenience
export const {
  conditionName,
  conditionDisplayName,
  conditionShortDescription,
  siteUrl,
  contactEmail,
  pubmedSearchQuery,
  pubmedStartYear,
  clinicalTrialsCondition,
  enableResearcherProfiles,
  enableInstitutionMap,
  maxPapersForProfiles,
  bootswatchTheme,
  plausibleDomain,
  googleAnalyticsId,
  maxPapersTotal,
  maxClinicalTrials,
  buildTimeoutMinutes,
  openAlexEmail,
  debugMode,
  apiCacheHours,
} = siteConfig;

// Validation function (can be called during build)
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!conditionName) errors.push('CONDITION_NAME is required');
  if (!conditionDisplayName) errors.push('CONDITION_DISPLAY_NAME is required');
  if (!pubmedSearchQuery) errors.push('PUBMED_SEARCH_QUERY is required');

  // Validate URL format
  if (siteUrl && !siteUrl.startsWith('http')) {
    errors.push('SITE_URL must start with http:// or https://');
  }

  // Validate email format
  if (contactEmail && !contactEmail.includes('@')) {
    errors.push('CONTACT_EMAIL must be a valid email address');
  }

  // Validate year
  if (pubmedStartYear < 1900 || pubmedStartYear > new Date().getFullYear()) {
    errors.push('PUBMED_START_YEAR must be between 1900 and current year');
  }

  // Validate numeric limits
  if (maxPapersTotal < 1) errors.push('MAX_PAPERS_TOTAL must be greater than 0');
  if (maxPapersForProfiles < 1) errors.push('MAX_PAPERS_FOR_PROFILES must be greater than 0');
  if (maxClinicalTrials < 1) errors.push('MAX_CLINICAL_TRIALS must be greater than 0');

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default siteConfig;
