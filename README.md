# Test Wallet (Solana Extension)

**Developed by Sagar Regmi**

A simple Solana wallet browser extension for Devnet, inspired by Phantom. Supports wallet creation, naming, balance check, and SOL transfer.

---

## Features
- Create a new Solana wallet
- Name your wallet
- View public key and balance
- Send SOL to other addresses
- Refresh balance

---

## File Overview & High-Level Flow

### Main Files & Their Purpose

- **src/popup/index.tsx**: Main React component for the extension popup. Handles wallet creation, naming, balance display, sending SOL, and UI logic.
- **src/background/index.ts**: Background service worker. Handles transaction signing and communication between content script and extension storage.
- **src/content/index.ts**: Content script. Bridges communication between dApps/webpages and the extension, and injects the provider into the page context.
- **public/injected.js**: Injected provider script. Exposes `window.solanaWallet` to dApps so they can interact with the extension (connect, sign transactions).
- **public/manifest.json**: Chrome extension manifest. Declares permissions, scripts, icons, and extension metadata.
- **public/icons/**: Contains extension icon images in required sizes.
- **webpack.config.js**: Webpack configuration for building and bundling the extension.
- **tsconfig.json**: TypeScript configuration.

### High-Level Flow

1. **User opens the extension popup**
   - `src/popup/index.tsx` loads, checks for an existing wallet, and displays balance and controls.
2. **User creates a wallet**
   - Generates a new keypair, saves it (and optional name) in Chrome storage.
3. **User sends SOL**
   - Fills recipient and amount, triggers a transaction using Solana Web3.js, and updates balance.
4. **dApp wants to connect**
   - dApp calls `window.solanaWallet.connect()` (from `public/injected.js`).
   - The injected provider posts a message, which is handled by `src/content/index.ts`.
   - The content script communicates with the popup/background to get the public key and responds to the dApp.
5. **dApp requests transaction signing**
   - dApp calls `window.solanaWallet.signTransaction()`.
   - The request is routed through the content script to the background script, which signs using the stored keypair and returns the signature.

---

## Getting Started

### 1. Clone or Download
- Clone this repo or download the source code.

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Extension
```bash
npm run build
```

### 4. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist` folder

---

## Usage
- Open the extension from the Chrome toolbar.
- Create a new wallet and (optionally) give it a name.
- Copy your public key and use a Solana devnet faucet to fund your wallet.
- Check your balance, send SOL, and refresh as needed.

---

## Sharing
- To share with others, zip the contents of the `dist` folder and send it.
- Recipients should unzip and load the folder in Chrome as above.

---

## Credits
**Test Wallet** developed by Sagar Regmi.

---

## License
MIT 