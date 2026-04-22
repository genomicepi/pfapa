# Contributing to ResearchNet Template

Thank you for your interest in contributing! This template helps patient advocacy groups and research communities create comprehensive research databases.

> 🔧 **Contributing to the template itself?**  
> You're in the right place! **Fork this repository** to contribute.
> 
> 🏥 **Creating a research site for your condition?**  
> You want [README.md](../README.md) instead — use **"Use this template"** not Fork.

---

## Ways to Contribute

### 🐛 Report Bugs

Found a bug? Open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your configuration (condition, dataset size)
- Error messages or screenshots

### 💡 Suggest Features

Have an idea? Open a discussion or issue with:
- Use case description
- How it helps the community
- Proposed implementation (if applicable)

### 📖 Improve Documentation

Help others by:
- Fixing typos or clarifying instructions
- Adding examples
- Translating documentation
- Creating video tutorials

### 🔧 Submit Code

**Before submitting a PR:**

1. **Test with multiple conditions**
   - Rare disease (~600 papers)
   - Medium dataset (~2,000 papers)
   - Large dataset (~20,000 papers)

2. **Check build times**
   - Ensure changes don't significantly increase build time
   - Optimize for GitHub Actions free tier

3. **Update documentation**
   - Update README.md with technical details
   - Update SETUP.md with user-facing changes
   - Add examples if applicable

4. **Follow existing patterns**
   - Use configuration from .env.template
   - Match code style
   - Add comments for complex logic

**PR Process:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test locally (`npm run dev` and `npm run build`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

**PR Template:**

```markdown
## Description
Brief description of changes

## Motivation
Why is this change needed?

## Testing
- [ ] Tested with rare disease dataset
- [ ] Tested with large dataset
- [ ] Build completes in <30 minutes
- [ ] No breaking changes to existing configs

## Screenshots
(if applicable)
```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/researchnet-template.git
cd researchnet-template

# Install dependencies
npm install

# Copy and configure .env
cp .env.template .env
# Edit .env with test data

# Run dev server
npm run dev

# Test scripts
npm run fetch-pubmed -- --years=1
npm run fetch-trials
npm run build-profiles
npm run build
```

## Code Style

- **JavaScript/TypeScript**: 2-space indentation
- **Astro**: Match existing component patterns
- **Comments**: Explain "why" not "what"
- **Naming**: Descriptive variable names

## Commit Messages

Use conventional commits:

- `feat: add treatment pipeline export`
- `fix: correct PubMed date filtering`
- `docs: update setup guide`
- `perf: optimize OpenAlex queries`
- `refactor: simplify config loading`

## Areas We'd Love Help With

- **Data Sources**: Integrate additional APIs (WHO, FDA, etc.)
- **Visualizations**: New chart types, interactive graphs
- **Accessibility**: WCAG compliance improvements
- **Performance**: Build time optimizations
- **Internationalization**: Multi-language support
- **Testing**: Unit and integration tests
- **Examples**: Sample sites for different conditions

## Questions?

- Open a [Discussion](https://github.com/genomicepi/researchnet-template/discussions)
- Tag issues with `question` label

## Code of Conduct

Be respectful, inclusive, and constructive. We're here to help patient communities access research information.

---

**Thank you for helping make research more accessible! 🔬**
