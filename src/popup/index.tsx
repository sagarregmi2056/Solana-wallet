import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import styled, { ThemeProvider, DefaultTheme } from 'styled-components';
import * as bip39 from 'bip39';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { QRCodeSVG } from 'qrcode.react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

declare module 'styled-components' {
    export interface DefaultTheme {
        colors: {
            primary: string;
            secondary: string;
            text: string;
            background: string;
            border: string;
            card: string;
            error: string;
            success: string;
        }
    }
}

// Theme
const lightTheme: DefaultTheme = {
    colors: {
        primary: '#512da8',
        secondary: '#311b92',
        text: '#333',
        background: '#f5f5f5',
        border: '#e0e0e0',
        card: '#fff',
        error: '#d32f2f',
        success: '#388e3c'
    }
};

const darkTheme: DefaultTheme = {
    colors: {
        primary: '#7c4dff',
        secondary: '#b388ff',
        text: '#fff',
        background: '#121212',
        border: '#333',
        card: '#1e1e1e',
        error: '#f44336',
        success: '#4caf50'
    }
};

const Container = styled.div<{ theme: DefaultTheme }>`
  width: 350px;
  padding: 15px;
  font-family: 'Roboto', sans-serif;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: 600px;
  overflow-y: auto;
`;

const Header = styled.div<{ theme: DefaultTheme }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.h1`
  font-size: 20px;
  margin: 0;
  font-weight: 600;
`;

const Balance = styled.div<{ theme: DefaultTheme }>`
  font-size: 28px;
  font-weight: bold;
  margin: 15px 0;
  color: ${props => props.theme.colors.primary};
  text-align: center;
`;

const Button = styled.button<{ theme: DefaultTheme }>`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  margin: 5px 0;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: ${props => props.theme.colors.secondary};
  }
`;

const Input = styled.input<{ theme: DefaultTheme }>`
  width: 100%;
  padding: 8px;
  margin: 4px 0;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text};
`;

const Message = styled.div<{ error?: boolean; theme: DefaultTheme }>`
  margin-top: 10px;
  color: ${props => props.error ? props.theme.colors.error : props.theme.colors.success};
  font-size: 14px;
`;

const Card = styled.div<{ theme: DefaultTheme }>`
  background: ${props => props.theme.colors.card};
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  border: 1px solid ${props => props.theme.colors.border};
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const Tab = styled.button<{ $active: boolean; theme: DefaultTheme }>`
  flex: 1;
  padding: 10px;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: all 0.3s;
  
  &:first-child {
    border-radius: 5px 0 0 5px;
  }
  
  &:last-child {
    border-radius: 0 5px 5px 0;
  }
`;

const TokenList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin: 10px 0;
`;

const TokenCard = styled.div<{ theme: DefaultTheme }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin: 8px 0;
  background: ${props => props.theme.colors.card};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const TokenInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TokenSymbol = styled.div<{ theme: DefaultTheme }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const TokenAmount = styled.div<{ theme: DefaultTheme }>`
  font-size: 14px;
  color: ${props => props.theme.colors.primary};
`;

const TokenPrice = styled.div<{ theme: DefaultTheme }>`
  font-size: 12px;
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
`;

const QRCodeContainer = styled.div<{ theme: DefaultTheme }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: ${props => props.theme.colors.card};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  margin: 20px 0;
`;

const QRCodeWrapper = styled.div`
  padding: 10px;
  background: white;
  border-radius: 8px;
  margin: 10px 0;
`;

const AddressText = styled.div<{ theme: DefaultTheme }>`
  font-size: 12px;
  color: ${props => props.theme.colors.text};
  word-break: break-all;
  text-align: center;
  margin: 10px 0;
`;

const SeedPhraseContainer = styled(Card)`
  margin: 20px 0;
`;

const SeedPhraseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 20px 0;
`;

const SeedWord = styled.div<{ theme: DefaultTheme }>`
  background: ${props => props.theme.colors.background};
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.border};
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const SeedWordNumber = styled.span`
  color: ${props => props.theme.colors.primary};
  margin-right: 5px;
  font-weight: bold;
`;

const SeedPhraseWarning = styled.div<{ theme: DefaultTheme }>`
  background: ${props => props.theme.colors.error}20;
  border: 1px solid ${props => props.theme.colors.error};
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
  color: ${props => props.theme.colors.error};
  font-size: 14px;
  line-height: 1.5;
`;

const NetworkSelector = styled.select<{ theme: DefaultTheme }>`
  width: 100%;
  padding: 8px;
  margin: 4px 0;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text};
`;

const ThemeToggle = styled.button<{ theme: DefaultTheme }>`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
`;

const TransactionCard = styled(Card)`
  margin: 10px 0;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const TransactionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 10px 0;
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: 10px;
`;

const TokenChart = styled.div`
  margin: 20px 0;
  padding: 15px;
  background: ${props => props.theme.colors.card};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const ChartContainer = styled.div`
  height: 200px;
  width: 100%;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 15px 0;
`;

const QuickActionButton = styled.button<{ theme: DefaultTheme }>`
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
  }
`;

const ActionIcon = styled.span`
  font-size: 20px;
`;

const ActionLabel = styled.span`
  font-size: 12px;
`;

const AdvancedSection = styled.div<{ theme: DefaultTheme }>`
    margin: 15px 0;
    padding: 15px;
    background: ${props => props.theme.colors.card};
    border-radius: 8px;
    border: 1px solid ${props => props.theme.colors.border};
`;

const AlertList = styled.div`
    margin: 10px 0;
`;

const AlertItem = styled.div<{ theme: DefaultTheme }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: ${props => props.theme.colors.background};
    border-radius: 4px;
    margin: 5px 0;
`;

const StakingCard = styled.div<{ theme: DefaultTheme }>`
    background: ${props => props.theme.colors.card};
    border-radius: 8px;
    padding: 15px;
    margin: 10px 0;
    border: 1px solid ${props => props.theme.colors.border};
`;

const NewsItem = styled.div<{ theme: DefaultTheme }>`
    padding: 10px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    cursor: pointer;
    
    &:hover {
        background: ${props => props.theme.colors.background};
    }
`;

interface TransactionHistory {
    signature: string;
    timestamp: number;
    type: 'send' | 'receive';
    amount: number;
    from: string;
    to: string;
    token?: string;
}

interface Token {
    mint: string;
    amount: number;
    decimals: number;
    symbol?: string;
    price?: number;
    priceChange24h?: number;
}

interface TokenAlert {
    token: string;
    price: number;
    condition: 'above' | 'below';
    enabled: boolean;
}

interface StakedToken {
    token: string;
    amount: number;
    apy: number;
    rewards: number;
}

interface TokenNews {
    title: string;
    source: string;
    date: string;
    url: string;
}

const Popup: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);
    const [publicKey, setPublicKey] = useState<string>('');
    const [walletName, setWalletName] = useState<string>('');
    const [recipient, setRecipient] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [mnemonic, setMnemonic] = useState<string>('');
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'tokens' | 'send' | 'history' | 'advanced'>('tokens');
    const [tokens, setTokens] = useState<Token[]>([]);
    const [network, setNetwork] = useState<'devnet' | 'testnet' | 'mainnet-beta'>('devnet');
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [tokenPriceHistory, setTokenPriceHistory] = useState<any>(null);
    const [transactionStats, setTransactionStats] = useState({
        totalSent: 0,
        totalReceived: 0,
        averageAmount: 0,
        mostFrequentRecipient: ''
    });
    const [tokenAlerts, setTokenAlerts] = useState<TokenAlert[]>([]);
    const [stakedTokens, setStakedTokens] = useState<StakedToken[]>([]);
    const [tokenNews, setTokenNews] = useState<TokenNews[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [newAlert, setNewAlert] = useState<{ token: string; price: number; condition: 'above' | 'below' }>({
        token: '',
        price: 0,
        condition: 'above'
    });

    const getConnection = () => {
        const endpoints = {
            'devnet': 'https://api.devnet.solana.com',
            'testnet': 'https://api.testnet.solana.com',
            'mainnet-beta': 'https://api.mainnet-beta.solana.com'
        };
        return new Connection(endpoints[network]);
    };

    useEffect(() => {
        const connection = getConnection();
        chrome.storage.local.get(['wallet'], (result) => {
            if (result.wallet) {
                const pubKey = new PublicKey(result.wallet.publicKey);
                setPublicKey(pubKey.toString());
                setWalletName(result.wallet.name || '');
                connection.getBalance(pubKey).then((bal) => {
                    setBalance(bal / LAMPORTS_PER_SOL);
                });
                fetchTokens(pubKey);
            }
        });
    }, [network]);

    const fetchTokens = async (pubKey: PublicKey) => {
        const connection = getConnection();
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
                programId: TOKEN_PROGRAM_ID,
            });

            const tokenList: Token[] = await Promise.all(
                tokenAccounts.value.map(async (account) => {
                    const parsedInfo = account.account.data.parsed.info;
                    const mint = parsedInfo.mint;
                    const amount = parsedInfo.tokenAmount.uiAmount;
                    const decimals = parsedInfo.tokenAmount.decimals;

                    // Try to get token symbol (this is a simplified version)
                    let symbol = 'Unknown';
                    try {
                        const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
                        if (tokenInfo.value?.data) {
                            const data = tokenInfo.value.data as any;
                            symbol = data.parsed?.info?.symbol || 'Unknown';
                        }
                    } catch (e) {
                        console.error('Error fetching token symbol:', e);
                    }

                    return { mint, amount, decimals, symbol };
                })
            );

            setTokens(tokenList);
        } catch (e) {
            console.error('Error fetching tokens:', e);
        }
    };

    const createWallet = async () => {
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const keypair = Keypair.fromSeed(new Uint8Array(seed.slice(0, 32)));
        setMnemonic(mnemonic);
        chrome.storage.local.set({
            wallet: {
                publicKey: keypair.publicKey.toString(),
                secretKey: Array.from(keypair.secretKey),
                name: walletName,
                mnemonic: mnemonic
            }
        });
        setPublicKey(keypair.publicKey.toString());
    };

    const importWallet = async () => {
        if (!bip39.validateMnemonic(mnemonic)) {
            setMessage('Invalid mnemonic');
            return;
        }
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const keypair = Keypair.fromSeed(new Uint8Array(seed.slice(0, 32)));
        chrome.storage.local.set({
            wallet: {
                publicKey: keypair.publicKey.toString(),
                secretKey: Array.from(keypair.secretKey),
                name: walletName
            }
        });
        setPublicKey(keypair.publicKey.toString());
        setMnemonic('');
        setIsImporting(false);
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
        const connection = getConnection();
        connection.getBalance(new PublicKey(publicKey)).then((bal) => {
            setBalance(bal / LAMPORTS_PER_SOL);
        });
        fetchTokens(new PublicKey(publicKey));
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
            const connection = getConnection();
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey: new PublicKey(recipient),
                    lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
                })
            );
            const signature = await connection.sendTransaction(tx, [keypair]);
            await connection.confirmTransaction(signature, 'confirmed');
            setMessage('Transfer successful!');
            const bal = await connection.getBalance(keypair.publicKey);
            setBalance(bal / LAMPORTS_PER_SOL);
            setRecipient('');
            setAmount('');
        } catch (e: any) {
            setMessage('Transfer failed: ' + (e.message || e.toString()));
        }
    };

    const fetchTransactions = async (pubKey: PublicKey) => {
        const connection = getConnection();
        try {
            const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 20 });
            const txList = (await Promise.all(
                signatures.map(async (sig) => {
                    const tx = await connection.getParsedTransaction(sig.signature);
                    if (!tx) return null;

                    const timestamp = sig.blockTime ? sig.blockTime * 1000 : Date.now();
                    const postBalance = tx.meta?.postBalances[0] ?? 0;
                    const preBalance = tx.meta?.preBalances[0] ?? 0;
                    const type = postBalance > preBalance ? 'receive' : 'send';
                    const amount = Math.abs(postBalance - preBalance) / LAMPORTS_PER_SOL;

                    return {
                        signature: sig.signature,
                        timestamp,
                        type,
                        amount,
                        from: tx.transaction.message.accountKeys[0].pubkey.toString(),
                        to: tx.transaction.message.accountKeys[1].pubkey.toString()
                    };
                })
            )).filter((tx): tx is TransactionHistory => tx !== null);

            setTransactions(txList);
            calculateTransactionStats(txList);
        } catch (e) {
            console.error('Error fetching transactions:', e);
        }
    };

    const calculateTransactionStats = (txs: TransactionHistory[]) => {
        const stats = {
            totalSent: 0,
            totalReceived: 0,
            averageAmount: 0,
            mostFrequentRecipient: ''
        };

        const recipientCount: { [key: string]: number } = {};

        txs.forEach(tx => {
            if (tx.type === 'send') {
                stats.totalSent += tx.amount;
                recipientCount[tx.to] = (recipientCount[tx.to] || 0) + 1;
            } else {
                stats.totalReceived += tx.amount;
            }
        });

        stats.averageAmount = (stats.totalSent + stats.totalReceived) / txs.length;
        stats.mostFrequentRecipient = Object.entries(recipientCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        setTransactionStats(stats);
    };

    const sendToken = async (token: Token, amount: number) => {
        if (!publicKey || !recipient) return;

        try {
            const connection = getConnection();
            const result = await chrome.storage.local.get(['wallet']);
            if (!result.wallet) {
                setMessage('No wallet found');
                return;
            }

            const keypair = Keypair.fromSecretKey(Uint8Array.from(result.wallet.secretKey));
            const fromTokenAccount = await getAssociatedTokenAddress(
                new PublicKey(token.mint),
                keypair.publicKey
            );

            const toTokenAccount = await getAssociatedTokenAddress(
                new PublicKey(token.mint),
                new PublicKey(recipient)
            );

            const transaction = new Transaction().add(
                createTransferInstruction(
                    fromTokenAccount,
                    toTokenAccount,
                    keypair.publicKey,
                    amount * Math.pow(10, token.decimals)
                )
            );

            const latestBlockhash = await connection.getLatestBlockhash();
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = keypair.publicKey;

            const signature = await connection.sendTransaction(transaction, [keypair]);
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            });

            setMessage('Token transfer successful!');
            fetchTokens(new PublicKey(publicKey));
        } catch (e: any) {
            setMessage('Token transfer failed: ' + e.message);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatAmount = (amount: number) => {
        return amount.toFixed(4);
    };

    const addPriceAlert = () => {
        if (newAlert.token && newAlert.price > 0) {
            setTokenAlerts([...tokenAlerts, { ...newAlert, enabled: true }]);
            setNewAlert({ token: '', price: 0, condition: 'above' });
        }
    };

    const toggleAlert = (index: number) => {
        const newAlerts = [...tokenAlerts];
        newAlerts[index].enabled = !newAlerts[index].enabled;
        setTokenAlerts(newAlerts);
    };

    const removeAlert = (index: number) => {
        setTokenAlerts(tokenAlerts.filter((_, i) => i !== index));
    };

    const renderAdvancedTab = () => (
        <Card>
            <h3>Advanced Features</h3>
            <AdvancedSection>
                <h4>Price Alerts</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Input
                        type="text"
                        placeholder="Token Symbol"
                        value={newAlert.token}
                        onChange={e => setNewAlert({ ...newAlert, token: e.target.value })}
                    />
                    <Input
                        type="number"
                        placeholder="Price"
                        value={newAlert.price}
                        onChange={e => setNewAlert({ ...newAlert, price: parseFloat(e.target.value) })}
                    />
                    <select
                        value={newAlert.condition}
                        onChange={e => setNewAlert({ ...newAlert, condition: e.target.value as 'above' | 'below' })}
                    >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                    </select>
                    <Button onClick={addPriceAlert}>Add Alert</Button>
                </div>
                <AlertList>
                    {tokenAlerts.map((alert, index) => (
                        <AlertItem key={index}>
                            <div>
                                {alert.token} {alert.condition} ${alert.price}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Button onClick={() => toggleAlert(index)}>
                                    {alert.enabled ? 'Disable' : 'Enable'}
                                </Button>
                                <Button onClick={() => removeAlert(index)}>Remove</Button>
                            </div>
                        </AlertItem>
                    ))}
                </AlertList>
            </AdvancedSection>

            <AdvancedSection>
                <h4>Staking</h4>
                {stakedTokens.map((stake, index) => (
                    <StakingCard key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{stake.token}</div>
                                <div>Staked: {stake.amount}</div>
                                <div>APY: {stake.apy}%</div>
                            </div>
                            <div>
                                <div>Rewards: {stake.rewards}</div>
                                <Button>Claim Rewards</Button>
                            </div>
                        </div>
                    </StakingCard>
                ))}
            </AdvancedSection>

            <AdvancedSection>
                <h4>Token News</h4>
                {tokenNews.map((news, index) => (
                    <NewsItem key={index} onClick={() => window.open(news.url, '_blank')}>
                        <div style={{ fontWeight: 'bold' }}>{news.title}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            {news.source} • {news.date}
                        </div>
                    </NewsItem>
                ))}
            </AdvancedSection>
        </Card>
    );

    return (
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <Container>
                <Header>
                    <Title>Solana Wallet</Title>
                    <ThemeToggle onClick={() => setIsDarkMode(!isDarkMode)}>
                        {isDarkMode ? '☀️' : '🌙'}
                    </ThemeToggle>
                </Header>
                {!publicKey ? (
                    <>
                        <div style={{ marginBottom: 8 }}>
                            <Input type="text" placeholder="Wallet Name (optional)" value={walletName} onChange={e => setWalletName(e.target.value)} />
                        </div>
                        {!isImporting ? (
                            <Button onClick={createWallet}>Create New Wallet</Button>
                        ) : (
                            <>
                                <Input type="text" placeholder="Enter Seed Phrase" value={mnemonic} onChange={e => setMnemonic(e.target.value)} />
                                <Button onClick={importWallet}>Import Wallet</Button>
                            </>
                        )}
                        <Button onClick={() => setIsImporting(!isImporting)}>{isImporting ? 'Create New Wallet' : 'Import Wallet'}</Button>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>Wallet Name</div>
                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{walletName || 'My Wallet'}</div>
                            </div>
                            <NetworkSelector value={network} onChange={(e) => setNetwork(e.target.value as any)}>
                                <option value="devnet">Devnet</option>
                                <option value="testnet">Testnet</option>
                                <option value="mainnet-beta">Mainnet</option>
                            </NetworkSelector>
                        </div>
                        <Balance>Balance: {balance} SOL</Balance>
                        <QuickActions>
                            <QuickActionButton onClick={() => setActiveTab('send')}>
                                <ActionIcon>📤</ActionIcon>
                                <ActionLabel>Send</ActionLabel>
                            </QuickActionButton>
                            <QuickActionButton onClick={() => setActiveTab('tokens')}>
                                <ActionIcon>💎</ActionIcon>
                                <ActionLabel>Tokens</ActionLabel>
                            </QuickActionButton>
                            <QuickActionButton onClick={() => setActiveTab('history')}>
                                <ActionIcon>📊</ActionIcon>
                                <ActionLabel>History</ActionLabel>
                            </QuickActionButton>
                            <QuickActionButton onClick={() => setActiveTab('advanced')}>
                                <ActionIcon>🔍</ActionIcon>
                                <ActionLabel>Advanced</ActionLabel>
                            </QuickActionButton>
                        </QuickActions>
                        <QRCodeContainer>
                            <h3>Scan to Receive</h3>
                            <QRCodeWrapper>
                                <QRCodeSVG
                                    value={publicKey}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                />
                            </QRCodeWrapper>
                            <AddressText>{publicKey}</AddressText>
                        </QRCodeContainer>
                        <Tabs>
                            <Tab $active={activeTab === 'tokens'} onClick={() => setActiveTab('tokens')}>Tokens</Tab>
                            <Tab $active={activeTab === 'send'} onClick={() => setActiveTab('send')}>Send</Tab>
                            <Tab $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>History</Tab>
                            <Tab $active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')}>Advanced</Tab>
                        </Tabs>
                        {activeTab === 'tokens' && (
                            <Card>
                                <h3>Your Tokens</h3>
                                <TokenList>
                                    {tokens.map((token, index) => (
                                        <TokenCard key={index} onClick={() => setSelectedToken(token)}>
                                            <TokenInfo>
                                                <TokenSymbol>{token.symbol || 'Unknown'}</TokenSymbol>
                                                <TokenAmount>{formatAmount(token.amount)}</TokenAmount>
                                                {token.price && (
                                                    <TokenPrice>
                                                        ${token.price.toFixed(2)} ({token.priceChange24h ? token.priceChange24h > 0 ? '+' : '' : ''}{token.priceChange24h?.toFixed(2)}%)
                                                    </TokenPrice>
                                                )}
                                            </TokenInfo>
                                        </TokenCard>
                                    ))}
                                </TokenList>
                                {selectedToken && (
                                    <TokenChart>
                                        <h4>{selectedToken.symbol} Price History</h4>
                                        <ChartContainer>
                                            <Line
                                                data={{
                                                    labels: ['1D', '1W', '1M', '3M', '6M', '1Y'],
                                                    datasets: [{
                                                        label: `${selectedToken.symbol} Price`,
                                                        data: [65, 59, 80, 81, 56, 55],
                                                        fill: false,
                                                        borderColor: 'rgb(75, 192, 192)',
                                                        tension: 0.1
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: false
                                                        }
                                                    }
                                                }}
                                            />
                                        </ChartContainer>
                                    </TokenChart>
                                )}
                                <Button onClick={fetchBalance}>Refresh</Button>
                            </Card>
                        )}
                        {activeTab === 'send' && (
                            <Card>
                                <h3>Send {selectedToken ? selectedToken.symbol : 'SOL'}</h3>
                                <Input type="text" placeholder="Recipient Address" value={recipient} onChange={e => setRecipient(e.target.value)} />
                                <Input type="number" placeholder={`Amount (${selectedToken ? selectedToken.symbol : 'SOL'})`} value={amount} onChange={e => setAmount(e.target.value)} />
                                <Button onClick={() => selectedToken ? sendToken(selectedToken, parseFloat(amount)) : sendSol()}>
                                    Send {selectedToken ? selectedToken.symbol : 'SOL'}
                                </Button>
                            </Card>
                        )}
                        {activeTab === 'history' && (
                            <Card>
                                <h3>Transaction History</h3>
                                <TransactionGrid>
                                    <StatCard>
                                        <div>Total Sent</div>
                                        <div>{formatAmount(transactionStats.totalSent)} SOL</div>
                                    </StatCard>
                                    <StatCard>
                                        <div>Total Received</div>
                                        <div>{formatAmount(transactionStats.totalReceived)} SOL</div>
                                    </StatCard>
                                    <StatCard>
                                        <div>Average Amount</div>
                                        <div>{formatAmount(transactionStats.averageAmount)} SOL</div>
                                    </StatCard>
                                    <StatCard>
                                        <div>Most Frequent Recipient</div>
                                        <div>{transactionStats.mostFrequentRecipient.slice(0, 8)}...</div>
                                    </StatCard>
                                </TransactionGrid>
                                {transactions.map((tx, index) => (
                                    <TransactionCard key={index}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div>{tx.type === 'send' ? 'Sent to' : 'Received from'}</div>
                                                <div>{tx.type === 'send' ? tx.to.slice(0, 8) : tx.from.slice(0, 8)}...</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: tx.type === 'send' ? 'red' : 'green' }}>
                                                    {tx.type === 'send' ? '-' : '+'}{formatAmount(tx.amount)} SOL
                                                </div>
                                                <div>{formatDate(tx.timestamp)}</div>
                                            </div>
                                        </div>
                                    </TransactionCard>
                                ))}
                                <Button onClick={() => fetchTransactions(new PublicKey(publicKey))}>Refresh</Button>
                            </Card>
                        )}
                        {activeTab === 'advanced' && renderAdvancedTab()}
                    </>
                )}
                {message && <Message error={message.includes('fail')}>{message}</Message>}
                {mnemonic && publicKey && (
                    <SeedPhraseContainer>
                        <h3>Save Your Seed Phrase</h3>
                        <SeedPhraseWarning>
                            ⚠️ Write down these 12 words in order and keep them safe. Anyone with these words can access your wallet.
                        </SeedPhraseWarning>
                        <SeedPhraseGrid>
                            {mnemonic.split(' ').map((word, index) => (
                                <SeedWord key={index}>
                                    <SeedWordNumber>{index + 1}.</SeedWordNumber>
                                    {word}
                                </SeedWord>
                            ))}
                        </SeedPhraseGrid>
                        <Button onClick={() => setMnemonic('')}>I've Saved It</Button>
                    </SeedPhraseContainer>
                )}
            </Container>
        </ThemeProvider>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Popup />); 