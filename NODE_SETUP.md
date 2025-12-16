# Node.js Package Management Setup

This project uses Node.js and npm for package management. This guide helps you set up a consistent development environment.

## Prerequisites

### Option 1: Using nvm (Node Version Manager) - Recommended

nvm allows you to install and switch between different Node.js versions easily.

#### Install nvm:

```bash
# Install nvm using the install script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Or using Homebrew (macOS)
brew install nvm
```

#### After installation, reload your shell:

```bash
# For zsh (default on macOS)
source ~/.zshrc

# Or for bash
source ~/.bashrc
```

#### Verify nvm is installed:

```bash
nvm --version
```

### Option 2: Using Homebrew (macOS)

If you prefer not to use nvm:

```bash
brew install node@20
```

## Project Setup

### 1. Install the correct Node.js version

This project uses Node.js 20.18.0 (specified in `.nvmrc`).

**If using nvm:**

```bash
# Navigate to project directory
cd /Users/gaurav/building/radio-show/radio-show/radio-show

# Install and use the Node version specified in .nvmrc
nvm install
nvm use

# Or install specific version
nvm install 20.18.0
nvm use 20.18.0
```

**If using Homebrew:**

```bash
brew install node@20
```

### 2. Verify Node.js version

```bash
node --version
# Should output: v20.18.0 (or similar v20.x.x)
```

### 3. Install project dependencies

```bash
# Install all dependencies
npm install

# This will:
# - Read package.json
# - Install dependencies to node_modules/
# - Create/update package-lock.json
```

### 4. Auto-switch Node version (optional)

Add this to your `~/.zshrc` to automatically switch Node versions when entering the project:

```bash
# Auto-switch Node version with nvm
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

## Package Management

### Installing new packages

```bash
# Install a production dependency
npm install <package-name>

# Install a development dependency
npm install --save-dev <package-name>

# Install exact version
npm install <package-name>@<version>
```

### Updating packages

```bash
# Check for outdated packages
npm outdated

# Update all packages (minor/patch versions)
npm update

# Update a specific package
npm install <package-name>@latest
```

### Managing Capacitor plugins

```bash
# Install a Capacitor plugin
npm install @capacitor/<plugin-name>
npx cap sync ios

# Example: Install microphone plugin
npm install @capacitor/microphone
npx cap sync ios
```

## Project Structure

```
radio-show/
├── package.json          # Project dependencies and scripts
├── package-lock.json     # Locked dependency versions (auto-generated)
├── .nvmrc                # Node.js version specification
├── .npmrc                # npm configuration
├── node_modules/         # Installed packages (gitignored)
└── mobile/              # Web app source
```

## Common Commands

```bash
# Install dependencies
npm install

# Sync Capacitor iOS platform
npm run sync:ios

# Open in Xcode
npm run ios

# Run on iOS simulator
npm run ios:run
```

## Troubleshooting

### "Command not found: nvm"

- Make sure nvm is installed and sourced in your shell
- Add nvm initialization to `~/.zshrc` or `~/.bashrc`

### "Wrong Node version"

```bash
# Check current version
node --version

# Switch to correct version (if using nvm)
nvm use

# Or install it
nvm install
```

### "npm install fails"

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Capacitor sync fails"

Make sure you're using the correct Node version and all dependencies are installed:

```bash
node --version  # Should be v20.x.x
npm install
npx cap sync ios
```

## Version Requirements

- **Node.js**: 20.18.0 (or any v20.x.x)
- **npm**: Comes with Node.js (v10.x.x or higher)
- **Capacitor**: ^5.0.0

## Notes

- `package-lock.json` is committed to git to ensure consistent installs
- `node_modules/` is gitignored (don't commit it)
- The `.nvmrc` file ensures all developers use the same Node version
- `.npmrc` configures npm behavior for this project
