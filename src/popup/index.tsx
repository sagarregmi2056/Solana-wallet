import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import styled from 'styled-components';
import { Keypair } from '@solana/web3.js';

const Container = styled.div`
  width: 350px;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Balance = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin: 20px 0;
`;

const Button = styled.button`
  background-color: #512da8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  margin: 5px 0;
  
  &:hover {
    background-color: #311b92;
  }
`;

const Popup: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);
    const [publicKey, setPublicKey] = useState<string>('');
    const [walletName, setWalletName] = useState<string>('');
    const [recipient, setRecipient] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        // Initialize connection to Solana network dev net 
        const connection = new Connection('https://api.devnet.solana.com');

        // Get wallet from storage
        chrome.storage.local.get(['wallet'], (result) => {
            if (result.wallet) {
                const pubKey = new PublicKey(result.wallet.publicKey);
                setPublicKey(pubKey.toString());
                setWalletName(result.wallet.name || '');

                // Get balance
                connection.getBalance(pubKey).then((bal) => {
                    setBalance(bal / LAMPORTS_PER_SOL);
                });
            }
        });
    }, []);

    const createWallet = async () => {
        // Generate new keypair
        const keypair = Keypair.generate();

        // Save to storage
        chrome.storage.local.set({
            wallet: {
                publicKey: keypair.publicKey.toString(),
                secretKey: Array.from(keypair.secretKey),
                name: walletName
            }
        });

        setPublicKey(keypair.publicKey.toString());
    };

    const saveWalletName = () => {
        chrome.storage.local.get(['wallet'], (result) => {
            if (result.wallet) {
                chrome.storage.local.set({
                    wallet: {
                        ...result.wallet,
                        name: walletName
                    }
                });
                setMessage('Wallet name saved!');
                setTimeout(() => setMessage(''), 2000);
            }
        });
    };

    const fetchBalance = () => {
        if (!publicKey) return;
        const connection = new Connection('https://api.devnet.solana.com');
        connection.getBalance(new PublicKey(publicKey)).then((bal) => {
            setBalance(bal / LAMPORTS_PER_SOL);
        });
    };

    const sendSol = async () => {
        setMessage('');
        try {
            if (!recipient || !amount) {
                setMessage('Recipient and amount required');
                return;
            }
            const result = await new Promise<any>(resolve => chrome.storage.local.get(['wallet'], resolve));
            if (!result.wallet) {
                setMessage('No wallet found');
                return;
            }
            const keypair = Keypair.fromSecretKey(Uint8Array.from(result.wallet.secretKey));
            const connection = new Connection('https://api.devnet.solana.com');
            const tx = new (await import('@solana/web3.js')).Transaction().add(
                (await import('@solana/web3.js')).SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey: new PublicKey(recipient),
                    lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
                })
            );
            const signature = await connection.sendTransaction(tx, [keypair]);
            await connection.confirmTransaction(signature, 'confirmed');
            setMessage('Transfer successful!');
            // Update balance
            const bal = await connection.getBalance(keypair.publicKey);
            setBalance(bal / LAMPORTS_PER_SOL);
            setRecipient('');
            setAmount('');
        } catch (e: any) {
            setMessage('Transfer failed: ' + (e.message || e.toString()));
        }
    };

    return (
        <Container>
            <Header>
                <h1>Solana Wallet</h1>
            </Header>
            {publicKey && (
                <>
                    <div><b>Wallet Name:</b> <input type="text" value={walletName} onChange={e => setWalletName(e.target.value)} style={{ width: '60%' }} /> <Button style={{ width: 'auto', padding: '5px 10px' }} onClick={saveWalletName}>Save</Button></div>
                </>
            )}
            {!publicKey ? (
                <>
                    <div style={{ marginBottom: 8 }}>
                        <input type="text" placeholder="Wallet Name (optional)" value={walletName} onChange={e => setWalletName(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px' }} />
                    </div>
                    <Button onClick={createWallet}>Create New Wallet</Button>
                </>
            ) : (
                <>
                    <div>Public Key: {publicKey}</div>
                    <Balance>Balance: {balance} SOL</Balance>
                    <Button onClick={() => window.open('https://explorer.solana.com/address/' + publicKey)}>
                        View on Explorer
                    </Button>
                    <hr style={{ margin: '20px 0' }} />
                    <div><b>Send SOL</b></div>
                    <input type="text" placeholder="Recipient Address" value={recipient} onChange={e => setRecipient(e.target.value)} style={{ width: '100%', padding: '8px', margin: '4px 0' }} />
                    <input type="number" placeholder="Amount (SOL)" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', padding: '8px', margin: '4px 0' }} />
                    <Button onClick={sendSol}>Send</Button>
                    {/* refresh balance for the wallet provider  */}
                    <Button onClick={fetchBalance}>Refresh Balance</Button>
                </>
            )}
            {message && <div style={{ marginTop: 10, color: message.includes('fail') ? 'red' : 'green' }}>{message}</div>}
        </Container>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Popup />); 