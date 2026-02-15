#!/bin/bash

# Jekyll Development Server Script
# Installiert Dependencies und startet den lokalen Development Server

set -e

echo "🚀 Jekyll Development Environment Setup"
echo "========================================"
echo ""

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Prüfe ob Ruby installiert ist
echo -n "Checking Ruby installation... "
if command -v ruby &> /dev/null; then
    RUBY_VERSION=$(ruby -v | cut -d ' ' -f2)
    echo -e "${GREEN}✓${NC} Ruby ${RUBY_VERSION} found"
else
    echo -e "${RED}✗${NC} Ruby not found!"
    echo "Please install Ruby first: https://www.ruby-lang.org/en/downloads/"
    exit 1
fi

# Prüfe ob Bundler installiert ist
echo -n "Checking Bundler installation... "
if command -v bundle &> /dev/null; then
    BUNDLER_VERSION=$(bundle -v | cut -d ' ' -f3)
    echo -e "${GREEN}✓${NC} Bundler ${BUNDLER_VERSION} found"
else
    echo -e "${YELLOW}!${NC} Bundler not found. Installing..."
    gem install bundler
    echo -e "${GREEN}✓${NC} Bundler installed"
fi

# Prüfe ob Gemfile existiert
echo -n "Checking Gemfile... "
if [ -f "Gemfile" ]; then
    echo -e "${GREEN}✓${NC} Gemfile found"
else
    echo -e "${RED}✗${NC} Gemfile not found!"
    exit 1
fi

# Installiere Dependencies
echo ""
echo "📦 Installing Jekyll dependencies..."
echo "-----------------------------------"
bundle install

# Prüfe Jekyll Installation
echo ""
echo -n "Verifying Jekyll installation... "
if bundle exec jekyll -v &> /dev/null; then
    JEKYLL_VERSION=$(bundle exec jekyll -v | cut -d ' ' -f2)
    echo -e "${GREEN}✓${NC} Jekyll ${JEKYLL_VERSION} ready"
else
    echo -e "${RED}✗${NC} Jekyll installation failed!"
    exit 1
fi

# Starte Development Server
echo ""
echo "🌐 Starting Jekyll development server..."
echo "---------------------------------------"
echo -e "${YELLOW}Server will be available at:${NC}"
echo "  → http://localhost:4000"
echo "  → http://127.0.0.1:4000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Starte Server mit live reload
bundle exec jekyll serve --livereload --host=0.0.0.0
