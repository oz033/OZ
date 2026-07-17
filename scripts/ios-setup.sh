#!/usr/bin/env bash
# OZGYM — iOS einmalig / nach Pull auf dem Mac
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> npm install"
npm install

echo "==> Web build + Capacitor sync"
npm run build
npx cap sync ios

echo "==> CocoaPods"
cd ios/App
pod install --repo-update
cd ../..

echo ""
echo "Fertig. Als Nächstes:"
echo "  open ios/App/App.xcworkspace"
echo "  → Xcode: Signing Team wählen → iPhone → Run"
echo ""
