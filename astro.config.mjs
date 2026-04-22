import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load site URL from config
function getSiteUrl() {
  const envPath = join(__dirname, '.env');
  const envTemplatePath = join(__dirname, '.env.template');
  const configPath = existsSync(envPath) ? envPath : envTemplatePath;

  try {
    const content = readFileSync(configPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('SITE_URL=')) {
        const url = line.split('=')[1].trim();
        return url || undefined;
      }
    }
  } catch (error) {
    console.warn('Could not read site URL from config, using default');
  }

  return undefined;
}

// Extract base path from site URL for GitHub Pages project sites
function getBasePath(siteUrl) {
  if (!siteUrl) return undefined;

  try {
    const url = new URL(siteUrl);
    // If it's a github.io URL with a path (project site), use that path
    if (url.hostname.includes('github.io') && url.pathname !== '/') {
      return url.pathname;
    }
    // Custom domain or user/org site - no base path needed
    return undefined;
  } catch (error) {
    return undefined;
  }
}

const siteUrl = getSiteUrl();
const basePath = getBasePath(siteUrl);

export default defineConfig({
  site: siteUrl,
  base: basePath,
  output: 'static',
  integrations: [tailwind()],
});
