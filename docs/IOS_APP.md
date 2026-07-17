# OZGYM iOS App (Capacitor + ML Kit)

Native iPhone-App mit **sofortigem Barcode-Scan** (Google ML Kit).  
Web/PWA auf Vercel bleibt unverändert (Fallback mit Foto/Manuell).

| Umgebung | Scan |
|----------|------|
| **OZGYM.app** (dieses Projekt) | Nativ, fullscreen, EAN/UPC |
| Safari / Home-Screen | Web (Foto-first) |

## Voraussetzungen (nur Mac)

- macOS + **Xcode** (aktuell)
- **CocoaPods**: `sudo gem install cocoapods`
- Node.js 20+
- iPhone per USB, **Entwicklermodus** an
- Optional: Apple Developer (TestFlight/Store)

## Einmalig / nach jedem `git pull`

```bash
cd vibing
chmod +x scripts/ios-setup.sh
./scripts/ios-setup.sh
```

Oder manuell:

```bash
npm install
npm run ios:sync
cd ios/App && pod install && cd ../..
open ios/App/App.xcworkspace   # NICHT .xcodeproj
```

### In Xcode

1. Projekt **App** → **Signing & Capabilities** → Team = deine Apple-ID  
2. Bundle ID falls nötig: `app.ozgym.tracker`  
3. Zielgerät: dein iPhone  
4. ▶ **Run**  
5. Beim ersten Scan: **Kamera erlauben**

## Nach Web-Code-Änderungen

```bash
npm run ios:sync
# Xcode: Run erneut (oder Product → Run)
```

## Projekt-Fakten

| Key | Wert |
|-----|------|
| App-Name | OZGYM |
| Bundle ID | `app.ozgym.tracker` |
| Min. iOS | **15.5** (ML Kit) |
| webDir | `dist` |
| Package Manager | **CocoaPods** (SPM absichtlich nicht — ML Kit) |
| Kamera | `NSCameraUsageDescription` in Info.plist |

## Code-Pfade

- `src/lib/nativePlatform.js` — `scanBarcodeNative()` / `canUseNativeBarcode()`
- `src/lib/nativeApp.js` — StatusBar, Keyboard
- `src/tabs/FoodTab.jsx` — `openScanner()` nutzt nativ, sonst Web
- `ios/App/Podfile` — Capacitor + ML Kit Pods

## Troubleshooting

**„No such module Capacitor“**  
→ Workspace öffnen (`App.xcworkspace`), nicht `App.xcodeproj`.  
→ `cd ios/App && pod install`

**Signing error**  
→ Kostenloses Personal Team reicht zum Testen auf eigenem iPhone.

**Scan startet nicht**  
→ Einstellungen → OZGYM → Kamera an.  
→ Deployment Target ≥ 15.5.

**CocoaPods nicht gefunden**  
```bash
sudo gem install cocoapods
pod --version
```

**Windows**  
Nur Code/Sync möglich. **Build & Run nur auf dem Mac.**

## Store / TestFlight (später)

1. Apple Developer Program  
2. App-ID + Zertifikate in Xcode  
3. Archive → Distribute → TestFlight  

## Sicherheit / Privacy

Kamera nur für Barcode-Lebensmittel. Text für App Store Review steht in `Info.plist`.
