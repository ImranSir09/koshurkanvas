# 🎨 Kashur Kanvas (کٲشُر کینواس)
### *The Ultimate Kashmiri Unicode Typography & Graphic Design Studio*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Unicode](https://img.shields.io/badge/Unicode-Standard%2015.1-green.svg)](https://unicode.org/)
[![Capacitor](https://img.shields.io/badge/Android-Ready%20(Capacitor%208)-3880FF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

**Kashur Kanvas** is a modern, high-precision typography editor and multi-layer graphic canvas designed specifically for the **Kashmiri language (Koshur / کٲشُر)** in Perso-Arabic Nastaliq and Arabic scripts. It solves the long-standing challenges of Kashmiri digital writing—including missing specialized vowels, complex diacritical stacking, ligatures, and arbitrary character styling—while providing an intuitive graphic design canvas.

---

## 🌟 Key Highlights & Features

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    KASHUR KANVAS STUDIO                                     │
├──────────────────────────────────────┬──────────────────────────────────────────────────────┤
│  📝 DEDICATED KASHMIRI UNICODE INPUT │  🎨 MULTI-LAYER GRAPHIC CANVAS                       │
│  • Specialized Nastaliq on-screen KB │  • Multi-layer vector text manipulation              │
│  • 5 Categorized Keyboard Layouts    │  • Per-span arbitrary style & gradient highlights    │
│  • Phonetic Voice-to-Text (Speech)   │  • Smart magnetic snapping & auditory feedback       │
│  • Kashmiri ↔ Latin Transliteration  │  • Custom .ttf/.otf/.woff2 font upload engine        │
│  • Autocorrect typo cleaner          │  • Ultra-HD Export: 4K PNG, JPEG, PDF, DOCX, TXT     │
└──────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

- **✨ Native Kashmiri Unicode Keyboard**: Full coverage of all standard and rare Kashmiri Perso-Arabic characters (`ٲ`, `ۄ`, `ؠ`, `ژ`, `ٕ`, `ٔ`, `ٚ`, `٘`, `ۆ`, `ٳ`, `ٖ`, `ٗ`, `ےٚ`).
- **🔤 Rich Arbitrary Span Formatting**: Format individual letters, words, or sentences within any layer (gradients, solid colors, font sizes, weights, drop shadows, and background pills).
- **📐 Magnetic Snapping Engine**: Precision object alignment with visual bounding guides, center guides, and real-time Web Audio click & snap feedback.
- **🔄 Professional Immutable Undo/Redo**: 60-step history manager with debounced grouping for smooth typing and transformer interactions (`Ctrl+Z`, `Ctrl+Shift+Z`).
- **🖼️ Multi-Aspect Canvas & Sheet Modes**: Switch effortlessly between Instagram Story (9:16), Square (1:1), Portrait (4:5), Landscape (16:9), A4 Document, A3 Poster, and Social Banners.
- **🖨️ Multi-Format Export Engine**: Export crisp 1x to 4x Retina PNGs, high-quality JPEGs, vector-accurate multi-page PDFs with embedded typography, Microsoft Word (.docx), and plain text.
- **🎙️ Voice-to-Text Input**: Built-in Speech Recognition engine tuned for regional Kashmiri, Urdu, and Arabic phonetic speech.

---

## ⌨️ Kashmiri Unicode Keyboard Architecture

Kashur Kanvas features a custom-engineered virtual keyboard designed to render correctly in cascading Nastaliq fonts (like *Noto Nastaliq Urdu* and *Gulzar*) without broken glyph shaping or disconnected ligatures.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                KASHMIRI KEYBOARD TOP QUICK BAR                                   │
│  [ ٲ ] [ ۄ ] [ ؠ ] [ ژ ] [ ◌ٕ ] [ ◌ٔ ] [ ◌ٚ ] [ ◌٘ ] [ ےٚ ] [ ۆ ] [ ٳ ] [ ◌ٖ ] [ ◌ٗ ] [ پھ ] [ تھ ]  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Primary Alphabet Layout (`حروفِ تہجی`)
Contains all primary Kashmiri and Perso-Arabic consonants and primary vowel anchors:

```
[Row 1]   ٲ   ۄ   ؠ   ژ   چ   پ   ٹ   ت   ڈ   د   ھ
[Row 2]   ش   س   ی   ب   ل   ا   ن   م   ک   گ   ر
[Row 3]   ف   غ   ح   ج   ز   ڑ   و   ہ   ع   ق   ے
```

### 2. Shift Layout (`حروفِ ثانوی و نایاب`)
Access secondary forms, aspirated digraphs (*do-chashmi* forms), and extended Arabic glyphs:

```
[Row 1]   ٳ   ۆ   ۄٚ   ےٚ   ێ   ط   ظ   ص   ض   ث   ذ
[Row 2]   خ   ں   ݨ   ۂ   ۃ   ء   ئ   ؤ   أ   إ   آ
[Row 3]   پھ  تھ  ٹھ  چھ  جھ  دھ  ڈھ  کھ  گھ  لا  لٲ
```

### 3. Kashmiri Vowels & Diacritics (`واوَل و اِعراب`)
Displays Harakat with dotted-circle base anchors (`◌`) to facilitate proper Nastaliq stacking:

```
[Row 1 - Kashmiri Vowels]   ◌ٔ   ◌ٕ   ◌ٚ   ◌٘   ◌ٖ   ◌ٗ   ◌ٟ   ◌ٓ
[Row 2 - Traditional]       ◌َ   ◌ِ   ◌ُ   ◌ْ   ◌ّ   ◌ٰ   ◌ّٰ   ◌ۡ
[Row 3 - Matras & Tanwin]   اَ   اِ   اُ   ایٖ  اوٗ  ◌ً   ◌ٍ   ◌ٌ
```

### 4. Numerals & Punctuation (`۱۲۳ و علامات`)
Full support for Kashmiri/Urdu digits and regional punctuation:

```
[Row 1 - Kashmiri Digits]   ۱   ۲   ۳   ۴   ۵   ۶   ۷   ۸   ۹   ۰
[Row 2 - Punctuation]       ۔   ،   ؟   ؛   :   !   —   -   /   \   ٪
[Row 3 - Math & Currency]   (   )   [   ]   {   }   +   ×   ÷   =   ₹   $
```

### 5. Sacred Phrases, Poetic Signs & Ligatures (`رموز، علامات و خطاطی`)
Essential marks for Kashmiri poetry (*Shayari*), classical literature, and calligraphy:

```
[Row 1 - Sacred]            ﷽   ﷺ   ﷻ   ؐ   ؑ   ؒ   ؓ   ۞   ۝   ۩
[Row 2 - Poetic & Editorial] ؎   ؏   ؂   ؀   ؁   ؍   ؃   ؞   ـ   …
[Row 3 - Quotes & Brackets]  ﴾   ﴿   «   »   “   ”   ‘   ’   ٭   ※   •
```

---

## 📋 Kashmiri Unicode Reference Guide

| Character | Unicode | Name / Description | Kashmiri Phonetic / Role |
| :---: | :---: | :--- | :--- |
| **ٲ** | `U+0672` | Arabic Letter Alef with Wavy Hamza Above | Central unrounded vowel (*Tsarur Alif*) |
| **ٳ** | `U+0673` | Arabic Letter Alef with Wavy Hamza Below | Short lower vowel / Subscript form |
| **ۄ** | `U+06C4` | Arabic Letter Waw with Ring | Short back rounded vowel (*Gol Wav*) |
| **ؠ** | `U+0620` | Arabic Letter Kashmiri Yeh | Palatalized semi-vowel (*Tshae Yeh*) |
| **ژ** | `U+0698` | Arabic Letter Tse | Affricate consonant /ts/ |
| **ۆ** | `U+06C6` | Arabic Letter Oe (Waw with V) | Short /o/ sound |
| **ےٚ** | `U+06D2 + U+065A` | Bari Yeh with Inverted V Above | Half-closed front unrounded vowel |
| **◌ٔ** | `U+0654` | Hamza Above (Kashmiri Hamza Path) | High central vowel diacritic |
| **◌ٕ** | `U+0655` | Hamza Below (Kashmiri Hamza Tal) | Lower central vowel diacritic |
| **◌ٚ** | `U+065A` | Inverted V Above | Short vowel modifier |
| **◌٘** | `U+0658` | Mark Noon Ghunna / Small V Above | Nasalization / Vowel shortening |
| **◌ٖ** | `U+0656` | Subscript Alef (Zer-e-Madd) | Long front close vowel /iː/ |
| **◌ٗ** | `U+0657` | Inverted Damma (Ulta Pesh) | Long back close vowel /uː/ |
| **ـ** | `U+0640` | Arabic Tatweel (Kashida) | Horizontal justification & elongation |

---

## 🛠️ Architecture & Tech Stack

```
kashur-kanvas/
├── src/
│   ├── components/
│   │   ├── KashmiriEditor.tsx           # Dual-mode workspace (Input & Canvas)
│   │   ├── KashmiriKeyboard.tsx         # Virtual 5-layout on-screen Unicode keyboard
│   │   ├── CanvasTextLayerObject.tsx    # Multi-layer canvas element with transform handles
│   │   ├── CombinedCanvasSelectionBox.tsx# Multi-layer selection boundary & action toolbar
│   │   ├── MobileTextDesignToolbar.tsx  # Typography, color, shadow, gradient & alignment toolbar
│   │   ├── LayerManagerPanel.tsx        # Layer stack reordering, visibility & grouping
│   │   ├── ColorGradientPicker.tsx      # Circular palette & gradient angle generator
│   │   ├── ExportModal.tsx              # Multi-format (PNG, JPG, PDF, DOCX) exporter modal
│   │   ├── ProjectsDrawer.tsx           # Local project save/load & templates manager
│   │   ├── CharacterPickerModal.tsx     # Extended Unicode glyphs search & insert
│   │   ├── TransliterationModal.tsx     # Bidirectional Latin ↔ Kashmiri converter
│   │   ├── VoiceInputButton.tsx         # Web Speech API speech-to-text listener
│   │   └── Header.tsx                   # Top app bar with Undo/Redo & project actions
│   ├── lib/
│   │   ├── undoManager.ts               # Immutable snapshot history stack with debouncing
│   │   ├── textEngine.ts                # Span styling, grapheme boundaries & slice math
│   │   ├── layerUtils.ts                # Layer grouping, alignment, merging & z-ordering
│   │   ├── snappingEngine.ts            # Magnetic guidelines & bounding box collision math
│   │   ├── exportEngine.ts              # High-DPI canvas rasterization & PDF builder
│   │   ├── kashmiriKeyboardLayouts.ts   # Keyboard matrix definitions & quick strips
│   │   ├── kashmiriTextTools.ts         # Transliteration, corrections & Urdu numerals
│   │   ├── fontUtils.ts                 # Font family resolvers & CSS generator
│   │   ├── customFonts.ts               # Local user font upload & @font-face injector
│   │   └── soundEffects.ts              # Web Audio API synthetic keyboard & snap sounds
│   ├── types/
│   │   └── index.ts                     # Type definitions for layers, spans, and configs
│   ├── App.tsx                          # Top-level state & modal orchestration
│   └── main.tsx                         # React entry point
```

---

## ⌨️ Keyboard Shortcuts & Gestures

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `Ctrl + Z` / `Cmd + Z` | **Undo** | Reverts the last action, text entry, or transformation |
| `Ctrl + Shift + Z` / `Ctrl + Y` | **Redo** | Restores the previously undone state |
| `Shift` *(on Virtual KB)* | **Shift Layout** | Toggles rare consonants and secondary vowel forms |
| `Long Press` *(Key)* | **Sub-Glyphs** | Reveals contextual variations and combined forms |
| `Click Canvas Object` | **Select Layer** | Activates transformation bounding box and typography controls |
| `Drag Bounding Handle` | **Scale / Rotate** | Smoothly resizes or rotates the active text layer |
| `Shift + Click` | **Multi-Select** | Selects multiple layers for bulk alignment or grouping |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone the Repository
```bash

```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to interact with the live editor.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory.

---

## 📱 Mobile & Android Native Support

Kashur Kanvas is built with Capacitor 8 and mobile-first responsive touch targets (minimum 44px for touch accuracy).

To build as an Android APK locally:
```bash
# Sync web build to Capacitor Android project
npm run cap:sync

# Open in Android Studio
npm run cap:open
```

---

## 🔒 Automated GitHub Actions Release Pipeline & Keystore Security

KoshurKanvas includes an automated GitHub Actions release workflow (`.github/workflows/release-android.yml`) that compiles, signs, verifies, and packages both **Signed Release APK** (`KoshurKanvas-release.apk`) and **Signed Release AAB** (`KoshurKanvas-release.aab`).

### 🔑 Required GitHub Secrets

To sign Android builds automatically without exposing sensitive credentials, set up the following secrets in your GitHub repository (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret Name | Description | Example / Notes |
| :--- | :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded string of your dedicated `.keystore` / `.jks` file | Created via `base64 -w 0 release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Master password for your Android keystore | e.g. `StrongStorePass#2026` |
| `ANDROID_KEY_ALIAS` | Key alias name defined when creating the keystore | e.g. `koshurkanvas-release-key` |
| `ANDROID_KEY_PASSWORD` | Password for the specific key alias | e.g. `StrongKeyPass#2026` |

---

### 🛡️ Keystore Generation & Security Instructions

> [!CAUTION]
> **NEVER** commit your production keystore file (`*.keystore`, `*.jks`), key passwords, or alias secrets to Git repository branches. The `.gitignore` file strictly excludes all `.keystore` and `.jks` files to prevent accidental commits.

#### 1. Generate a Dedicated Production Keystore
Run the following command in your local terminal (do not run inside public repositories):

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias koshurkanvas-release-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

#### 2. Convert Keystore to Base64 String
Encode the generated `release.keystore` file to Base64:

- **macOS / Linux**:
  ```bash
  base64 -i release.keystore -o keystore_base64.txt
  # OR
  base64 -w 0 release.keystore > keystore_base64.txt
  ```
- **Windows (PowerShell)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Set-Content keystore_base64.txt
  ```

#### 3. Save Keystore & Secrets Securely
1. Copy the contents of `keystore_base64.txt` into the `ANDROID_KEYSTORE_BASE64` GitHub secret.
2. Store your original `release.keystore` file and passwords in a secure offline backup or corporate password manager (e.g. 1Password, Bitwarden, HashiCorp Vault).
3. Delete local temporary text files (`rm keystore_base64.txt`).

---

### 🚀 Release Pipeline Workflow Steps

When a release is triggered (on push to `main`/`master`, git tag `v*`, or manual `workflow_dispatch`):

1. **Lint & Code Integrity**: Runs `npm run lint` (`tsc --noEmit`) to ensure type safety.
2. **Web Build & Capacitor Sync**: Executes `npm run build` and `npx cap sync android`.
3. **Keystore Reconstitution**: Safely decodes `ANDROID_KEYSTORE_BASE64` into a temporary runner file.
4. **Signed Gradle Builds**: Runs `./gradlew assembleRelease bundleRelease` with `signingConfigs.release`.
5. **Signature Verification**: Validates APK using `apksigner verify` and AAB using `jarsigner -verify`.
6. **Artifact Packaging**: Uploads `KoshurKanvas-release.apk` and `KoshurKanvas-release.aab` as downloadable build artifacts.

---

## 🤝 Contributing

Contributions to Kashmiri digital typography tools and linguistic preservation are warmly welcomed!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/kashmiri-calligraphy-presets`)
3. Commit your changes (`git commit -m 'Add new Nastaliq calligraphy presets'`)
4. Push to the branch (`git push origin feature/kashmiri-calligraphy-presets`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Crafted with ❤️ for the preservation and digital advancement of the Kashmiri language (کٲشُر).</sub>
</div>
