import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';

// Initialize Solana connection
const connection = new Connection('https://api.devnet.solana.com');

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SIGN_TRANSACTION') {
    handleSignTransaction(request.transaction, sendResponse);
    return true; // Will respond asynchronously
  }
});

async function handleSignTransaction(transaction: Transaction, sendResponse: (response: any) => void) {
  try {
    // Get wallet from storage
    const result = await chrome.storage.local.get(['wallet']);
    if (!result.wallet) {
      sendResponse({ error: 'No wallet found' });
      return;
    }

    // Reconstruct keypair from stored secret key
    const secretKey = new Uint8Array(result.wallet.secretKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    // Sign transaction
    transaction.sign(keypair);
    
    // Send signed transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    sendResponse({ signature });
  } catch (error) {
    sendResponse({ error: (error as Error).message });
  }
}

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Solana Wallet Extension installed');
}); 