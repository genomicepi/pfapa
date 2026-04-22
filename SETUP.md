# Setup Guide

**Comprehensive guide** for setting up and customizing your ResearchNet Template site.

> 💡 **Just want to deploy quickly?** See the [Quick Start in README](README.md#-quick-start-5-minutes) instead.

> ⚠️ **Important:** Use **"Use this template"** to create your site, **NOT** "Fork"  
> Fork is only for contributing improvements back to this template.

## Table of Contents

- [Initial Setup](#initial-setup)
- [Configuration Options](#configuration-options)
- [Local Development](#local-development)
- [Custom Domain Setup](#custom-domain-setup)
- [Theme Customization](#theme-customization)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Create Your Repository from Template

1. Click **"Use this template"** button (green button, top-right)
2. Name your repository (e.g., `pots-research`, `em-research`)
3. Choose **Public** (required for free GitHub Pages)
4. Click **"Create repository"**

### 2. Clone Your Repository

```bash
git clone https://github.com/YOUR-USERNAME/your-repo-name.git
cd your-repo-name
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Your Condition

Edit `.env.template` with your condition's public configuration. See [Configuration Options](#configuration-options) below.
Do not put API keys or tokens in `.env.template`; use local `.env` or GitHub Actions secrets instead.

### 5. Validate Configuration

```bash
npm run validate-config
```

This will check for errors and warnings in your configuration.

### 6. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions** (not "Deploy from a branch")
4. Click **Save**

### 7. Deploy

```bash
git add .env.template
git commit -m "Configure for [your condition]"
git push
```

Then:
1. Go to the **Actions** tab
2. Click **"Build and Deploy to GitHub Pages"**
3. Click **"Run workflow"**
4. Wait ~10 minutes for build to complete

Your site will be live at: `https://YOUR-USERNAME.github.io/your-repo-name`

---

## Configuration Options

All public, commit-safe configuration happens in `.env.template`. Here are the key options:

### Basic Information

```bash
# Internal name (lowercase, no spaces)
CONDITION_NAME=erythromelalgia

# Display name (proper capitalization)
CONDITION_DISPLAY_NAME=Erythromelalgia

# Short description (1-2 sentences for homepage)
CONDITION_SHORT_DESCRIPTION=A rare neurovascular disorder...

# Your site URL (update after deployment)
SITE_URL=https://yourusername.github.io/researchnet-template

# Contact email (shown in footer, optional - leave empty to hide)
CONTACT_EMAIL=contact@example.com
```

### Search Queries

#### PubMed Query Tips

The `PUBMED_SEARCH_QUERY` is crucial for finding relevant papers:

**Example 1: Single term**
```bash
PUBMED_SEARCH_QUERY=erythromelalgia
```

**Example 2: Multiple synonyms**
```bash
PUBMED_SEARCH_QUERY=erythromelalgia OR erythermalgia
```

**Example 3: Complex query with MeSH terms**
```bash
PUBMED_SEARCH_QUERY=(postural orthostatic tachycardia syndrome[MeSH] OR POTS[Title/Abstract])
```

Test your query at: https://pubmed.ncbi.nlm.nih.gov/

#### Clinical Trials

```bash
# Condition name as it appears on ClinicalTrials.gov
CLINICALTRIALS_CONDITION=erythromelalgia
```

Test at: https://clinicaltrials.gov/

### Features

```bash
# Enable researcher profiles and collaboration network
# Set to false for large datasets (>2,000 papers)
ENABLE_RESEARCHER_PROFILES=true

# Enable institution map visualization
ENABLE_INSTITUTION_MAP=true

# Enable treatment pipeline page (requires manual curation)
ENABLE_TREATMENT_PIPELINE=false
```

### Styling

```bash
# Bootswatch theme (see https://bootswatch.com/)
BOOTSWATCH_THEME=cosmo
```

**Available themes**: cerulean, cosmo, cyborg, darkly, flatly, journal, litera, lumen, lux, materia, minty, morph, pulse, quartz, sandstone, simplex, sketchy, slate, solar, spacelab, superhero, united, vapor, yeti, zephyr

### Build Limits

```bash
# Maximum papers to fetch (safety limit)
MAX_PAPERS_TOTAL=5000

# Maximum papers to use for researcher profiles
# Lower = faster builds, focuses on recent researchers
MAX_PAPERS_FOR_PROFILES=500

# Maximum clinical trials to fetch
MAX_CLINICAL_TRIALS=500
```

---

## Local Development

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:4321`

### Fetch Data Locally

```bash
# Fetch papers (seed mode - all papers from start year)
npm run fetch-pubmed -- --seed

# Fetch clinical trials
npm run fetch-trials

# Build researcher profiles
npm run build-profiles

# Or fetch everything at once
npm run fetch-data
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Custom Domain Setup

### Option 1: GitHub Pages Custom Domain

1. Purchase a domain (e.g., `yourCondition.org`)
2. Add DNS records (see your domain provider):
   ```
   Type: CNAME
   Name: www
   Value: YOUR-USERNAME.github.io
   ```
3. In your repository:
   - Settings → Pages → Custom domain
   - Enter: `www.yourcondition.org`
   - Wait for DNS check ✓
4. Update `.env.template`:
   ```bash
   SITE_URL=https://www.yourcondition.org
   ```
5. Commit and push

### Option 2: Apex Domain (no www)

Follow GitHub's guide: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

---

## Theme Customization

### Change Theme

1. Browse themes: https://bootswatch.com/
2. Update `.env.template`:
   ```bash
   BOOTSWATCH_THEME=darkly  # or any theme name
   ```
3. Commit and push

### Custom CSS

Create `src/styles/custom.css` and add to `MainLayout.astro`:

```astro
---
import '../styles/custom.css';
---
```

---

## Performance Tuning

### Large Datasets (>2,000 papers)

For common conditions with thousands of papers:

```bash
# 1. Increase start year to reduce papers
PUBMED_START_YEAR=2015  # Only last ~10 years

# 2. Disable expensive features
ENABLE_RESEARCHER_PROFILES=false
ENABLE_INSTITUTION_MAP=false

# 3. Reduce profile limit
MAX_PAPERS_FOR_PROFILES=300
```

**Build time**: ~5 minutes (vs ~30 minutes for full mode)

### Speed Up OpenAlex Queries (Recommended)

Get a **free OpenAlex API key** to make builds 5-10x faster:

1. **Register for free**: https://openalex.org/
2. **Get your API key** from your account settings
3. **Add as GitHub Secret**:
   - Go to your repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **"New repository secret"**
   - Name: `OPENALEX_API_KEY`
   - Value: (paste your API key)
   - Click **"Add secret"**

**For local development**: Create `.env` file (git-ignored):
```bash
OPENALEX_API_KEY=your-key-here
```

**Benefits:**
- ✅ 100,000 requests/day (vs 10/second without)
- ✅ ~2 min builds (vs ~10 min without key)
- ✅ No rate limit delays
- ✅ Completely free

### Very Common Conditions (>10,000 papers)

Consider filtering by subspecialty:

```bash
# Example: Only review articles
PUBMED_SEARCH_QUERY=diabetes AND (Review[PT] OR Meta-Analysis[PT])

# Example: Specific aspect
PUBMED_SEARCH_QUERY=diabetes AND neuropathy
```

---

## Troubleshooting

### Build Fails with "Too Many Papers"

**Error**: `Found 50,000 papers, but MAX_PAPERS_TOTAL is 5000`

**Solution**:
1. Narrow your `PUBMED_SEARCH_QUERY`
2. Increase `PUBMED_START_YEAR`
3. Or increase `MAX_PAPERS_TOTAL` (may cause slow builds)

### Build Timeout

**Error**: `Build exceeded 30 minutes`

**Solution**:
```bash
# Reduce profile limit
MAX_PAPERS_FOR_PROFILES=300

# Or disable profiles
ENABLE_RESEARCHER_PROFILES=false
```

### No Papers Found

**Error**: `No papers found`

**Solution**:
1. Test your query at https://pubmed.ncbi.nlm.nih.gov/
2. Check spelling and synonyms
3. Try broader search terms

### Site Not Updating

**Problem**: Pushed changes but site still shows old content

**Solution**:
1. Check **Actions** tab for failed builds
2. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
3. Wait 5-10 minutes for CDN to update

### 404 on GitHub Pages

**Problem**: Site shows 404 error

**Solution**:
1. Verify GitHub Pages is enabled (Settings → Pages)
2. Check source is set to **GitHub Actions** (not "Deploy from a branch")
3. Uncomment and set `base` in `astro.config.mjs` if using repo name in URL:
   ```js
   base: '/your-repo-name/',  // Match your repository name
   ```

---

## Weekly Auto-Updates

The template includes automatic weekly updates:

- **When**: Every Saturday at 5 AM UTC
- **What**: Fetches new papers, trials, and researcher updates
- **How**: GitHub Action commits data changes and redeploys

To disable:
1. Go to **Actions** tab
2. Click **"Weekly Data Update"**
3. Click **"Disable workflow"**

---

## Getting Help

- **Template Issues**: [GitHub Issues](https://github.com/genomicepi/researchnet-template/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/genomicepi/researchnet-template/discussions)
- **Documentation**: [README.md](README.md) and this setup guide

---

## Next Steps

- [ ] Review homepage copy in `src/pages/index.astro`
- [ ] Add analytics (Plausible or Google Analytics)
- [ ] Set up custom domain (optional)
- [ ] Join the community discussions

**Happy researching! 🔬**
