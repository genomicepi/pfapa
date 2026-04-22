# Template Deployment Checklist

Use this checklist when deploying a new condition-specific site from this template.

## Pre-Deployment

- [ ] Use "Use this template" to create your repository
- [ ] Clone repository locally
- [ ] Run `npm install`
- [ ] Edit `.env.template` with your condition details:
  - [ ] `CONDITION_NAME`
  - [ ] `CONDITION_DISPLAY_NAME`
  - [ ] `CONDITION_SHORT_DESCRIPTION`
  - [ ] `PUBMED_SEARCH_QUERY` (test at pubmed.ncbi.nlm.nih.gov first!)
  - [ ] `PUBMED_START_YEAR`
  - [ ] `CLINICALTRIALS_CONDITION`
  - [ ] `SITE_URL` (update with your GitHub Pages URL)
  - [ ] `CONTACT_EMAIL`
- [ ] Run `npm run validate-config` to check for errors
- [ ] Choose theme from https://bootswatch.com/ and set `BOOTSWATCH_THEME`

## Content Customization

- [ ] Review homepage copy in `src/pages/index.astro`
  - [ ] Confirm the introduction fits your condition and community
  - [ ] Confirm calls to action point users to the right data sections
  - [ ] Confirm external resources are appropriate for your audience
- [ ] Update `public/favicon.svg` (optional)

## GitHub Setup

- [ ] Enable GitHub Pages:
  - Settings → Pages
  - Source: **GitHub Actions**
- [ ] Verify repository is public (required for free GitHub Pages)
- [ ] Commit and push `.env.template` changes
- [ ] Manually trigger "Build and Deploy" workflow:
  - Actions tab → "Build and Deploy to GitHub Pages" → "Run workflow"
- [ ] Wait for deployment (~10-15 minutes for first build)
- [ ] Verify site is live at `https://YOUR-USERNAME.github.io/repo-name`

## Post-Deployment

- [ ] Test all pages:
  - [ ] Home page loads
  - [ ] Publications page shows data
  - [ ] Clinical Trials page shows data
  - [ ] Researchers page (if enabled)
  - [ ] Institutions page (if enabled)
- [ ] Check mobile responsiveness
- [ ] Verify navigation works
- [ ] Test search/filter functionality

## Optional Enhancements

- [ ] Set up custom domain:
  - [ ] Purchase domain
  - [ ] Configure DNS
  - [ ] Add to GitHub Pages settings
  - [ ] Update `SITE_URL` in `.env.template`
- [ ] Add analytics:
  - [ ] Sign up for Plausible or Google Analytics
  - [ ] Add tracking ID to `.env.template`
- [ ] Configure weekly auto-updates:
  - [ ] Verify "Weekly Data Update" workflow is enabled
  - [ ] Test manual trigger
- [ ] Social sharing:
  - [ ] Add Open Graph meta tags (in MainLayout.astro)
  - [ ] Create social share image
- [ ] Community:
  - [ ] Enable GitHub Discussions
  - [ ] Add link to Discord/Slack (if applicable)
  - [ ] Create CONTRIBUTING.md (if accepting contributions)

## Troubleshooting

If you encounter issues, check:

1. **Build fails**: Review Actions tab for error messages
2. **No data**: Verify PubMed query returns results
3. **404 error**: Ensure GitHub Pages source is "GitHub Actions"
4. **Slow builds**: Reduce `MAX_PAPERS_FOR_PROFILES` or disable features

See [SETUP.md](SETUP.md) for detailed troubleshooting.

---

## Example Completed Sites

- [Erythromelalgia](https://erythromelalgia.net) - Original implementation
- Add your site here! (Submit PR)

---

**Need help?** Open an issue on GitHub or check the [SETUP.md](SETUP.md) guide.
