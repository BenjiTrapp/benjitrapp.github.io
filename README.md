[![pages-build-deployment](https://github.com/BenjiTrapp/benjitrapp.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/BenjiTrapp/benjitrapp.github.io/actions/workflows/pages/pages-build-deployment)
[![Spell check](https://github.com/BenjiTrapp/benjitrapp.github.io/actions/workflows/spell-check.yml/badge.svg)](https://github.com/BenjiTrapp/benjitrapp.github.io/actions/workflows/spell-check.yml)
[![Check Markdown links](https://github.com/BenjiTrapp/benjitrapp.github.io/actions/workflows/check-md-links.yml/badge.svg)](https://github.com/BenjiTrapp/benjitrapp.github.io/actions/workflows/check-md-links.yml)

# Der Benji - Personal Blog

A personal technical blog focused on **DevSecOps**, **Cyber Security**, and **Cloud Security** - built with Jekyll and hosted on GitHub Pages.

## Content

The site organizes knowledge across blog posts and four dedicated collections:

| Section | Description |
|---------|-------------|
| **Blog** | Long-form posts on security topics, CTF writeups, and tooling |
| **Pensieve** | Cheatsheets and quick references (AWS, Azure, GCP, Linux, Nmap, etc.) |
| **Offense** | Red team techniques, EDR bypass, pivoting, reverse shells |
| **Defense** | Blue team practices, DFIR, hardening, detection engineering |
| **Culture** | DevOps culture, SSDLC, threat modeling, security maturity |

## Local Development

### Prerequisites

- [Ruby](https://rubyinstaller.org/) (with DevKit on Windows)
- Bundler (`gem install bundler`)

### Quick Start

**Windows (PowerShell):**

```powershell
.\dev.ps1
```

**Linux / macOS:**

```bash
./dev.sh
```

Both scripts install dependencies and start a local server with live reload at **http://localhost:4000**.

### Manual Setup

```bash
bundle install
bundle exec jekyll serve --livereload
```

## Project Structure

```
.
├── _posts/          # Blog posts
├── _memories/       # Pensieve collection (cheatsheets)
├── _attacks/        # Offense collection
├── _defenses/       # Defense collection
├── _cultures/       # Culture collection
├── _layouts/        # Page templates
├── _includes/       # Reusable HTML partials
├── _sass/           # SCSS partials
├── js/              # Client-side scripts (search, mobile nav, code copy)
├── assets/          # Static assets
├── images/          # Images
├── _config.yml      # Jekyll configuration
├── dev.ps1          # Windows dev script
└── dev.sh           # Unix dev script
```

## Tech Stack

- **Static Site Generator:** Jekyll 4.x
- **Hosting:** GitHub Pages
- **Markdown:** Kramdown with GFM
- **Syntax Highlighting:** Rouge (Base16 Dark theme)
- **Search:** Tipue Search (client-side)
- **Plugins:** jekyll-sitemap, jekyll-feed

## CI/CD

| Workflow | Purpose |
|----------|---------|
| Pages Build | Automatic deployment on push |
| Spell Check | Validates spelling in Markdown files |
| Link Check | Detects broken links (daily + on push) |
| Release (major/minor/patch) | Manual semantic version releases with changelog |

## License

[MIT](LICENSE) - Based on [Jekyll Now](https://github.com/barryclark/jekyll-now) by Barry Clark.
