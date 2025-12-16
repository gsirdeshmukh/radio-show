# Xcode Setup Guide

You need to install Xcode to build iOS apps. Here's how to fix the current issues:

## Issue 1: Xcode Not Installed

You currently only have Command Line Tools installed. You need the full Xcode app.

### Install Xcode:

1. **Open Mac App Store**
2. **Search for "Xcode"**
3. **Click "Get" or "Install"** (it's free, but large ~15GB download)
4. **Wait for installation** (this can take 30-60 minutes depending on your internet)

### After Xcode Installation:

1. **Open Xcode** (from Applications)
2. **Accept the license agreement** when prompted
3. **Install additional components** if prompted
4. **Set the active developer directory:**

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

Verify it worked:
```bash
xcode-select -p
# Should output: /Applications/Xcode.app/Contents/Developer
```

## Issue 2: CocoaPods Not Installed

CocoaPods is required for managing iOS dependencies. Install it:

```bash
sudo gem install cocoapods
```

If you get permission errors, you might need to use a Ruby version manager or install without sudo:

```bash
# Option 1: Install to user directory (no sudo needed)
gem install --user-install cocoapods

# Then add to PATH (add to ~/.zshrc)
export PATH="$HOME/.gem/ruby/$(ruby -e 'puts RUBY_VERSION[/\d+\.\d+/]')/bin:$PATH"
```

Or use Homebrew:
```bash
brew install cocoapods
```

Verify installation:
```bash
pod --version
```

## After Both Are Installed

Once Xcode and CocoaPods are installed, you can continue with Capacitor setup:

```bash
# Install npm dependencies (if not done)
npm install

# Add iOS platform
npx cap add ios

# Update Info.plist
./update-info-plist.sh

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

## Troubleshooting

### "xcode-select: error: tool 'xcodebuild' requires Xcode"
- Make sure Xcode is fully installed (not just Command Line Tools)
- Run: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`
- Verify: `xcode-select -p` should show `/Applications/Xcode.app/Contents/Developer`

### CocoaPods installation fails
- Try: `brew install cocoapods` (if you have Homebrew)
- Or: `sudo gem install cocoapods` (if you have admin access)
- Make sure Ruby is installed: `ruby --version`

### "No such module 'Capacitor'"
- Run `npx cap sync ios` again
- Make sure you opened `App.xcworkspace`, not `App.xcodeproj`

