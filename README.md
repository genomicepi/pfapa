# ResearchNet Template

> **One-click deployment of comprehensive medical research databases for any condition**

Transform PubMed papers, clinical trials, and researcher networks into a beautiful, auto-updating public website. Perfect for rare disease advocacy groups, patient communities, and research organizations.

[![Use this template](https://img.shields.io/badge/Use%20this-Template-brightgreen?logo=github)](https://github.com/genomicepi/researchnet-template/generate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**See it in action**: [erythromelalgia.net](https://erythromelalgia.net) 

---

> 💡 **Creating a site for your condition?**  
> Click **"Use this template"** (green button above) — **NOT** "Fork"  
> 
> **Why?** Template creates a clean, independent repository for your project.  
> **Fork is only for** contributing improvements back to this template itself.

<details>
<summary><strong>❓ Template vs Fork — Which should I use?</strong></summary>

| Goal | Button to Click | Result |
|------|----------------|---------|
| **Create a research site for my condition** | ✅ **Use this template** | Clean repo, no fork relationship, your own project |
| **Improve this template (add features, fix bugs)** | 🔧 **Fork** | Linked repo, can submit pull requests back |

**Still confused?** If you're a patient advocate, foundation, or researcher → **Use this template**

</details>

---

## 🚀 Quick Start (5 minutes)

**Just want to get a site running?** Follow these 4 steps with default settings. For customization, see [Detailed Setup](#-detailed-setup) below.

### Step 1: Create Your Repository

1. Click the **"Use this template"** button above (green button, top-right)
2. Choose a repository name (e.g., `pots-research`, `yourCondition-net`)
3. Make it **Public** (required for free GitHub Pages)
4. Click **"Create repository"**

Then clone your new repo:

```bash
git clone https://github.com/YOUR-USERNAME/your-repo-name.git
cd your-repo-name
```

### Step 2: Configure Your Condition

Edit `.env.template` with your condition's details:

```bash
# Example for POTS (Postural Orthostatic Tachycardia Syndrome)
CONDITION_NAME=pots
CONDITION_DISPLAY_NAME=POTS
CONDITION_SHORT_DESCRIPTION=A form of dysautonomia characterized by an abnormal increase in heart rate upon standing
PUBMED_SEARCH_QUERY=postural orthostatic tachycardia syndrome OR POTS
PUBMED_START_YEAR=2010
CLINICALTRIALS_CONDITION=postural orthostatic tachycardia syndrome

# Update these:
SITE_URL=https://yourusername.github.io/your-repo-name
CONTACT_EMAIL=your-email@example.com
```

`.env.template` is a public, committed config file. Do not put API keys or tokens in it. Use local `.env` for machine-specific secrets and GitHub Actions secrets for CI.

### Step 3: Enable GitHub Pages

1. Go to your repository's **Settings → Pages**
2. Under "Build and deployment":
   - Source: **GitHub Actions**
3. Save

### Step 4: Deploy

```bash
git add .env.template
git commit -m "Configure for [your condition]"
git push
```

Then go to **Actions** tab and manually run **"Build and Deploy"** workflow.

**Done!** Your site will be live at `https://yourusername.github.io/your-repo-name` in ~10 minutes.

---

### Optional: Speed Up Builds (Recommended)

Get a **free OpenAlex API key** to make builds 5-10x faster:

1. Register at https://openalex.org/
2. Add key as repository secret: **Settings → Secrets → Actions → New secret**
   - Name: `OPENALEX_API_KEY`
   - Value: (your key)

Reduces build time from ~10 min → ~2 min. See [SETUP.md](SETUP.md#speed-up-openalex-queries-recommended) for details.

---

## 📝 Detailed Setup

**Need more control?** See **[SETUP.md](SETUP.md)** for:
- 📖 **Full configuration guide** - All `.env.template` options explained
- 🎨 **Theme customization** - 25+ themes, colors, custom CSS
- 🌐 **Custom domain setup** - Use your own domain name
- ⚡ **Performance tuning** - Optimize for large datasets
- 🐛 **Troubleshooting** - Common issues and solutions
- 💻 **Local development** - Test changes before deploying

**Quick navigation:**
- **Fast deployment** → Stay on this page (Quick Start above)
- **Full customization** → Read [SETUP.md](SETUP.md)

---

## ✨ Features

- 📚 **Research Papers** - Comprehensive PubMed database with interactive filters
- 🔬 **Clinical Trials** - Live data from ClinicalTrials.gov
- 👥 **Researcher Network** - Collaboration graphs and top researchers
- 🗺️ **Institution Map** - Geographic distribution of research activity
- 📈 **Publication Timeline** - Historical trends and velocity
- 🔄 **Auto-Updates** - Weekly automated data refresh
- 🎨 **25+ Themes** - Bootswatch theme support
- 💰 **Zero Cost** - Free hosting on GitHub Pages

---

## 📋 Requirements

- GitHub account (free)
- Basic familiarity with git
- Knowledge of your condition's PubMed search terms

No coding required! Just edit one config file.

---


## 📊 Works for Any Dataset Size

| Condition Type | Example | Papers | Build Time | Mode |
|----------------|---------|--------|------------|------|
| Rare disease | Erythromelalgia | 600 | ~10 min | Full |
| Medium | POTS | 2,000 | ~10 min | Full |
| Common | Long COVID | 20,000 | ~30 min | Lite |

---

## 🎯 Built for Patient Advocacy

Perfect for:
- Rare disease foundations
- Patient advocacy organizations
- Research communities
- Medical professional societies
- Academic research groups

---

## 🤝 Contributing

Want to improve the template itself?

> 🔧 **Contributing to this template?**  
> Click **"Fork"** — **NOT** "Use this template"  
> 
> **Why?** Fork creates a linked copy so you can submit pull requests.  
> See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

---

## 🙏 Acknowledgments

Data sources: [PubMed](https://pubmed.ncbi.nlm.nih.gov/), [ClinicalTrials.gov](https://clinicaltrials.gov/), [OpenAlex](https://openalex.org/)

---

## 🌟 Showcase

Sites built with this template:

- [**Erythromelalgia Research**](https://erythromelalgia.net) - Rare neurovascular disorder (600+ papers)

**Built a site?** Add yours! Submit a PR to this list or open an issue with your URL.

---

**Status**: Public beta (v0.1.0-beta)
