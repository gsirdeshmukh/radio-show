#!/bin/bash

# Script to update Info.plist with network security settings
# Run this after: npx cap add ios && npx cap sync ios

INFO_PLIST="ios/App/App/Info.plist"

if [ ! -f "$INFO_PLIST" ]; then
    echo "Error: Info.plist not found at $INFO_PLIST"
    echo "Please run 'npx cap add ios' first"
    exit 1
fi

echo "Updating Info.plist with network security settings..."

# Check if NSAppTransportSecurity already exists
if grep -q "NSAppTransportSecurity" "$INFO_PLIST"; then
    echo "NSAppTransportSecurity already exists in Info.plist"
    echo "Please manually verify the settings are correct"
    exit 0
fi

# Create a temporary file with the network security settings
cat > /tmp/network_security.xml << 'EOF'
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
EOF

# Use Python to insert the XML before the closing </dict> tag
python3 << 'PYTHON_SCRIPT'
import re
import sys

info_plist_path = "ios/App/App/Info.plist"
network_security_path = "/tmp/network_security.xml"

try:
    with open(info_plist_path, 'r') as f:
        content = f.read()
    
    with open(network_security_path, 'r') as f:
        network_security = f.read()
    
    # Find the last </dict> before </plist> and insert before it
    # We want to insert before the root </dict> tag
    pattern = r'(\t</dict>\s*</plist>)'
    
    if re.search(pattern, content):
        new_content = re.sub(pattern, network_security + r'\1', content, count=1)
        
        with open(info_plist_path, 'w') as f:
            f.write(new_content)
        
        print("✓ Successfully updated Info.plist")
    else:
        print("Error: Could not find insertion point in Info.plist")
        print("Please manually add the NSAppTransportSecurity settings")
        sys.exit(1)
        
except Exception as e:
    print(f"Error: {e}")
    print("Please manually update Info.plist as described in IOS_APP_SETUP.md")
    sys.exit(1)
PYTHON_SCRIPT

echo ""
echo "Done! You can now open the project in Xcode:"
echo "  npx cap open ios"

