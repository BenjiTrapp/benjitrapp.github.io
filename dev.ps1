# Jekyll Development Server Script
# Installiert Dependencies und startet den lokalen Development Server

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Jekyll Development Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Pruefe ob Ruby installiert ist
Write-Host "Checking Ruby installation... " -NoNewline
try {
    $rubyVersion = (ruby -v) -replace '^ruby\s+([^\s]+).*', '$1'
    Write-Host "OK" -ForegroundColor Green -NoNewline
    Write-Host " Ruby $rubyVersion found"
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Ruby not found! Please install Ruby first: https://www.ruby-lang.org/en/downloads/"
    Write-Host "On Windows, use RubyInstaller: https://rubyinstaller.org/"
    exit 1
}

# Pruefe ob Bundler installiert ist
Write-Host "Checking Bundler installation... " -NoNewline
$bundlerCmd = Get-Command bundle -ErrorAction SilentlyContinue
if ($bundlerCmd) {
    $bundlerVersion = (bundle -v) -replace '^Bundler version\s+', ''
    Write-Host "OK" -ForegroundColor Green -NoNewline
    Write-Host " Bundler $bundlerVersion found"
} else {
    Write-Host "NOT FOUND" -ForegroundColor Yellow -NoNewline
    Write-Host " Installing Bundler..."
    gem install bundler
    Write-Host "OK" -ForegroundColor Green -NoNewline
    Write-Host " Bundler installed"
}

# Pruefe ob Gemfile existiert
Write-Host "Checking Gemfile... " -NoNewline
if (Test-Path "Gemfile") {
    Write-Host "OK" -ForegroundColor Green -NoNewline
    Write-Host " Gemfile found"
} else {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Gemfile not found!"
    exit 1
}

# Installiere Dependencies
Write-Host ""
Write-Host "Installing Jekyll dependencies..." -ForegroundColor Cyan
Write-Host "-----------------------------------"
bundle install

# Pruefe Jekyll Installation
Write-Host ""
Write-Host "Verifying Jekyll installation... " -NoNewline
try {
    $jekyllVersion = (bundle exec jekyll -v) -replace '^jekyll\s+', ''
    Write-Host "OK" -ForegroundColor Green -NoNewline
    Write-Host " Jekyll $jekyllVersion ready"
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Jekyll installation failed!"
    exit 1
}

# Starte Development Server
Write-Host ""
Write-Host "Starting Jekyll development server..." -ForegroundColor Cyan
Write-Host "---------------------------------------"
Write-Host "Server will be available at:" -ForegroundColor Yellow
Write-Host "  -> http://localhost:4000"
Write-Host "  -> http://127.0.0.1:4000"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Starte Server mit live reload
bundle exec jekyll serve --livereload --host=0.0.0.0
