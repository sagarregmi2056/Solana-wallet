import { Keypair } from '@solana/web3.js';

declare global {
  interface Window {
    solana: {
      createKeypair: () => Promise<Keypair>;
    };
  }
} 