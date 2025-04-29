window.solanaWallet = {
  connect: () => {
    return new Promise((resolve, reject) => {
      window.postMessage({ type: 'SOLANA_WALLET_CONNECT' }, '*');
      window.addEventListener('message', function handler(event) {
        if (event.data.type === 'SOLANA_WALLET_CONNECT_SUCCESS') {
          window.removeEventListener('message', handler);
          resolve(event.data.publicKey);
        } else if (event.data.type === 'SOLANA_WALLET_CONNECT_ERROR') {
          window.removeEventListener('message', handler);
          reject(new Error(event.data.error));
        }
      });
    });
  },
  
  signTransaction: (transaction) => {
    return new Promise((resolve, reject) => {
      window.postMessage({ type: 'SOLANA_WALLET_SIGN_TRANSACTION', transaction }, '*');
      window.addEventListener('message', function handler(event) {
        if (event.data.type === 'SOLANA_WALLET_SIGN_SUCCESS') {
          window.removeEventListener('message', handler);
          resolve(event.data.signature);
        } else if (event.data.type === 'SOLANA_WALLET_SIGN_ERROR') {
          window.removeEventListener('message', handler);
          reject(new Error(event.data.error));
        }
      });
    });
  }
}; 