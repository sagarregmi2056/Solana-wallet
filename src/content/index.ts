// Listen for messages from the webpage
window.addEventListener('message', async (event) => {
  // Only accept messages from the same frame
  if (event.source !== window) return;

  const message = event.data;

  // Handle different message types
  switch (message.type) {
    case 'SOLANA_WALLET_CONNECT':
      handleConnect(event);
      break;
    case 'SOLANA_WALLET_SIGN_TRANSACTION':
      handleSignTransaction(message.transaction, event);
      break;
  }
});

async function handleConnect(event: MessageEvent) {
  try {
    // Get wallet from storage
    const result = await chrome.storage.local.get(['wallet']);
    if (!result.wallet) {
      event.source?.postMessage({ type: 'SOLANA_WALLET_CONNECT_ERROR', error: 'No wallet found' }, { targetOrigin: '*' });
      return;
    }

    // Send public key back to dApp
    event.source?.postMessage({
      type: 'SOLANA_WALLET_CONNECT_SUCCESS',
      publicKey: result.wallet.publicKey
    }, { targetOrigin: '*' });
  } catch (error: unknown) {
    event.source?.postMessage({
      type: 'SOLANA_WALLET_CONNECT_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { targetOrigin: '*' });
  }
}

async function handleSignTransaction(transaction: any, event: MessageEvent) {
  try {
    // Send transaction to background script for signing
    chrome.runtime.sendMessage(
      { type: 'SIGN_TRANSACTION', transaction },
      (response) => {
        if (response.error) {
          event.source?.postMessage({
            type: 'SOLANA_WALLET_SIGN_ERROR',
            error: response.error
          }, { targetOrigin: '*' });
        } else {
          event.source?.postMessage({
            type: 'SOLANA_WALLET_SIGN_SUCCESS',
            signature: response.signature
          }, { targetOrigin: '*' });
        }
      }
    );
  } catch (error: unknown) {
    event.source?.postMessage({
      type: 'SOLANA_WALLET_SIGN_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { targetOrigin: '*' });
  }
}

// Inject provider into webpage as an external script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
document.documentElement.appendChild(script); 