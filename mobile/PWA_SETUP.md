# PWA Setup Guide

Your mobile app is now configured as a Progressive Web App (PWA) and can be installed on your phone!

## Quick Setup

### 1. Generate Icons

You need to create two PNG icons (192x192 and 512x512). Choose one method:

**Option A: Using the HTML Generator (Easiest)**
1. Open `generate-icons.html` in your browser
2. The icons will automatically download
3. Move them to the `mobile/` directory

**Option B: Using Node.js Script**
```bash
cd mobile
npm install sharp
node generate-icons.js
```

**Option C: Manual Creation**
- Create `icon-192.png` (192x192 pixels)
- Create `icon-512.png` (512x512 pixels)
- Use the provided `icon.svg` as a reference
- Place both files in the `mobile/` directory

### 2. Serve Over HTTPS

PWAs require HTTPS (except for localhost). Options:

**Local Development:**
```bash
# Using Python with HTTPS (requires cert)
python3 -m http.server 5173

# Or use a tool like local-ssl-proxy
npx local-ssl-proxy --source 5173 --target 5173
```

**Production:**
- Deploy to GitHub Pages (free HTTPS)
- Use Netlify, Vercel, or similar
- Use your own domain with SSL

### 3. Install on Your Phone

**iOS (Safari):**
1. Open the app in Safari on your iPhone
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired
5. Tap "Add"

**Android (Chrome):**
1. Open the app in Chrome on your Android device
2. Tap the menu (3 dots)
3. Tap "Add to Home screen" or "Install app"
4. Confirm the installation

## Testing Locally

1. Start your server:
   ```bash
   python3 -m http.server 5173
   ```

2. On your phone, connect to the same WiFi network

3. Find your computer's local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or use
   ipconfig getifaddr en0
   ```

4. Open `http://YOUR_IP:5173/mobile/` on your phone

5. For HTTPS locally, use a tool like `ngrok`:
   ```bash
   npx ngrok http 5173
   # Then use the HTTPS URL provided
   ```

## Features Enabled

- ✅ Standalone app mode (no browser UI)
- ✅ Offline caching (basic)
- ✅ App icons
- ✅ Splash screen (iOS)
- ✅ Theme color matching

## Troubleshooting

**Icons not showing:**
- Make sure `icon-192.png` and `icon-512.png` exist in `/mobile/`
- Check browser console for errors
- Verify manifest.json paths are correct

**Install prompt not appearing:**
- Ensure you're using HTTPS (or localhost)
- Check that service worker registered successfully
- Clear browser cache and try again
- Verify manifest.json is accessible

**Service worker not registering:**
- Check browser console for errors
- Ensure `sw.js` is accessible at `/mobile/sw.js`
- Verify you're not in private/incognito mode

## Next Steps

- Customize the app name in `manifest.json`
- Add more sophisticated offline caching strategies
- Implement push notifications (optional)
- Add app shortcuts (Android)

