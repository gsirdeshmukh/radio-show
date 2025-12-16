# iOS Setup Notes

## Current Status

The iOS platform has been added and Info.plist has been updated with:
- ✅ Microphone usage description
- ✅ Network security settings for Spotify, SoundCloud, and Supabase

## ⚠️ IMPORTANT: Xcode Installation Required

**Xcode.app is NOT currently installed.** Only Command Line Tools are installed, which is insufficient for iOS development.

### Step 1: Install Xcode

1. **Open Mac App Store**
2. **Search for "Xcode"**
3. **Click "Get" or "Install"** (it's free, but large ~15GB download)
4. **Wait for installation** (30-60 minutes depending on internet speed)

### Step 2: After Xcode Installation

1. **Open Xcode** (from Applications)
2. **Accept the license agreement** when prompted
3. **Install additional components** if prompted
4. **Set the active developer directory:**
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

5. **Verify it worked:**
   ```bash
   xcode-select -p
   # Should output: /Applications/Xcode.app/Contents/Developer
   ```

6. **Accept Xcode license (if needed):**
   ```bash
   sudo xcodebuild -license accept
   ```

### Step 3: Fix CocoaPods Encoding

1. **Set terminal encoding:**
   ```bash
   export LANG=en_US.UTF-8
   # Add to ~/.zshrc for persistence
   echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Then sync again:**
   ```bash
   npx cap sync ios
   ```

## Next Steps

1. Open the project in Xcode:
   ```bash
   npx cap open ios
   ```

2. In Xcode:
   - Select the project in navigator
   - Select "App" target
   - **General Tab:**
     - Display Name: `RADIO-LAB`
     - Bundle Identifier: `com.radiolab.app`
     - Version: `1.0.0`
     - Build: `1`
   - **Signing & Capabilities Tab:**
     - ✅ Enable "Automatically manage signing"
     - Select your Team (requires Apple Developer account)
     - Add "Microphone" capability if not already present
     - Add "Background Modes" → enable "Audio, AirPlay, and Picture in Picture" (if needed for background playback)

3. Test in Simulator:
   - Select a simulator (e.g., "iPhone 15 Pro")
   - Click Run (▶️) or press `Cmd+R`

4. Test on Physical Device:
   - Connect iPhone via USB
   - Select your device from device dropdown
   - Click Run
   - On iPhone: Settings → General → VPN & Device Management → Trust developer certificate

5. Build for TestFlight:
   - Select "Any iOS Device" from device dropdown
   - Product → Archive
   - Distribute App → App Store Connect → Upload
   - Configure in App Store Connect → TestFlight tab

## Capabilities Added

- **Microphone**: Required for voice recording
- **Network Security**: Configured for Spotify, SoundCloud, and Supabase APIs
