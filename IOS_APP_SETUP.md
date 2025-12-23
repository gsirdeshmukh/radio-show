# iOS App Setup Guide - Converting PWA to Native App

This guide will help you convert your PWA into a native iOS app that can be distributed via TestFlight.

## Prerequisites

1. **Node.js and npm** (if not already installed):
   ```bash
   # Install via Homebrew (recommended on macOS)
   brew install node
   
   # Or download from https://nodejs.org/
   ```

2. **Xcode** (from Mac App Store)
   - Required for building iOS apps
   - Includes iOS Simulator for testing

3. **Apple Developer Account** ($99/year)
   - Required for TestFlight distribution
   - Sign up at https://developer.apple.com/

## Step 1: Install Dependencies

```bash
cd /Users/gaurav/building/radio-show/radio-show/radio-show
npm install
npm install @capacitor/browser@^5.0.0
```

## Step 2: Initialize Capacitor (if not already done)

The `capacitor.config.ts` file has been created. Now add the iOS platform:

```bash
npx cap add ios
```

This will create an `ios/` directory with the Xcode project.

## Step 3: Sync Your Web App to iOS

```bash
npx cap sync ios
```

This copies your `mobile/` files into the iOS project.

## Step 4: Configure Network Security

After the iOS platform is added, you need to update the Info.plist file to allow network connections to your APIs.

The file will be at: `ios/App/App/Info.plist`

Add this XML inside the `<dict>` tag (before `</dict>`):

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>accounts.spotify.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
            <false/>
        </dict>
        <key>api.spotify.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
        <key>soundcloud.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
        <key>api-v2.soundcloud.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
        <key>supabase.co</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
        <key>supabase.net</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## Step 5: Open in Xcode

```bash
npx cap open ios
```

Or manually open `ios/App/App.xcworkspace` in Xcode.

## Step 6: Configure Xcode Project

In Xcode:

1. **Select the project** in the navigator (top item)
2. **Select the "App" target** (under TARGETS)
3. **General Tab:**
   - Display Name: `RADIO-LAB`
   - Bundle Identifier: `com.radiolab.app` (or change to match your Apple Developer account)
   - Version: `1.0.0`
   - Build: `1`
4. **Signing & Capabilities Tab:**
   - ✅ Enable "Automatically manage signing"
   - Select your **Team** (requires Apple Developer account)
   - Xcode will automatically create/select a provisioning profile

## Step 7: Add Required Capabilities

If your app uses:
- **Microphone**: Add "Microphone" capability
- **Background Audio**: Add "Background Modes" → enable "Audio, AirPlay, and Picture in Picture"

To add capabilities:
1. In Xcode, go to **Signing & Capabilities** tab
2. Click **+ Capability**
3. Add the required capabilities

## Step 7b: Spotify App Remote (Required for v1 Playback)

The mobile app controls Spotify via the iOS App Remote SDK (the Spotify app is the audio engine).

1. **Add the Spotify iOS SDK**
   - Xcode → File → Add Packages…
   - URL: `https://github.com/spotify/ios-sdk`
   - Add the `SpotifyiOS` package to the App target

2. **Register a URL Scheme**
   - In Xcode, select the App target → Info → URL Types
   - Add a new URL type with scheme `radioapp`
   - This must match the Spotify app redirect URI: `radioapp://callback`

3. **Add Query Schemes**
   - In `Info.plist`, add:
     ```xml
     <key>LSApplicationQueriesSchemes</key>
     <array>
       <string>spotify</string>
     </array>
     ```

4. **App Remote bridge (Capacitor plugin)**
   - Create a native plugin that exposes:
     - `connect({ clientId, redirectUri })`
     - `play({ uri })`
     - `pause()`
     - `resume()`
     - `seek({ positionMs })`
     - `getPlayerState()` → `{ positionMs, durationMs, isPaused }`
   - Hook `application(_:open:options:)` to pass the callback URL to Spotify:
     ```swift
     func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
         if spotifySessionManager.application(app, open: url, options: options) { return true }
         return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
     }
     ```
   - The web app calls `window.Capacitor.Plugins.SpotifyRemote` (see `mobile/app.js`).

5. **Spotify app requirement**
   - Playback requires the Spotify app installed on device.
   - If not installed, prompt the user to install from the App Store.

## Step 8: Test in iOS Simulator

1. In Xcode, select a simulator (e.g., "iPhone 15 Pro")
2. Click the **Run** button (▶️) or press `Cmd+R`
3. The app should launch in the simulator

## Step 9: Test on Physical Device

1. Connect your iPhone via USB
2. In Xcode, select your device from the device dropdown
3. Click **Run** (▶️)
4. On your iPhone: **Settings → General → VPN & Device Management**
5. Trust the developer certificate
6. The app will install and launch

## Step 10: Build for TestFlight

1. In Xcode, select **"Any iOS Device"** (or your connected device) from the device dropdown
2. **Product → Archive**
3. Wait for the archive to complete
4. The **Organizer** window will open automatically
5. Click **"Distribute App"**
6. Choose **"App Store Connect"**
7. Follow the prompts:
   - Choose "Upload"
   - Select your distribution certificate
   - Review and upload

## Step 11: Configure in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - Platform: iOS
   - Name: RADIO-LAB
   - Primary Language: English
   - Bundle ID: Select `com.radiolab.app` (must match Xcode)
   - SKU: (any unique identifier, e.g., `radiolab-001`)
4. Click **"Create"**
5. Go to **TestFlight** tab
6. Wait for processing (can take 10-30 minutes)
7. Add **Internal Testers** (up to 100 people on your team)
8. Add **External Testers** (up to 10,000, requires App Review)
9. Click **"Submit for Review"** (for external testers)

## Step 12: Testers Install via TestFlight

1. Testers need the **TestFlight app** (free from App Store)
2. You'll send them an invitation email
3. They accept the invitation
4. The app appears in TestFlight
5. They tap **"Install"**

## Troubleshooting

### "No such module 'Capacitor'"
- Run `npx cap sync ios` again
- Make sure you opened `App.xcworkspace`, not `App.xcodeproj`

### Network requests failing
- Check that Info.plist has the NSAppTransportSecurity settings
- Verify all domains are listed in NSExceptionDomains

### Build errors
- Make sure you have the latest Xcode
- Run `npx cap sync ios` to update native dependencies
- Clean build folder: **Product → Clean Build Folder** (`Cmd+Shift+K`)

### Signing errors
- Ensure you have an Apple Developer account
- Check that Bundle Identifier matches in Xcode and App Store Connect
- Verify "Automatically manage signing" is enabled

## Development Workflow

### Making Changes to Web App

1. Edit files in `mobile/` directory
2. Run `npx cap sync ios` to copy changes
3. Rebuild in Xcode or use live reload (see below)

### Live Reload (Development)

For faster development, you can use Capacitor's live reload:

```bash
# Terminal 1: Serve your web app
python3 -m http.server 5173

# Terminal 2: Run with live reload
npx cap run ios --external
```

Update `capacitor.config.ts` to point to your local server:
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:5173',
  cleartext: true
}
```

Then run `npx cap sync ios` and the app will reload when you make changes.

## Next Steps

- Customize app icons (replace default Capacitor icons)
- Add app screenshots for App Store
- Configure app metadata and description
- Set up push notifications (if needed)
- Add analytics (if desired)
