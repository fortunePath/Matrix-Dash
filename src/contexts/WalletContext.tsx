import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  openContractCall, 
  openSTXTransfer,
  authenticate,
  AppConfig,
  UserSession
} from '@stacks/connect';
import { 
  STACKS_TESTNET, 
  STACKS_MAINNET 
} from '@stacks/network';
import {
  uintCV,
  stringAsciiCV,
  principalCV,
  bufferCV,
  PostConditionMode
} from '@stacks/transactions';

// Network configuration - testnet for development
const network = STACKS_TESTNET;
console.log('Network configuration:', network);

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  stxBalance: number;
  connectWallet: () => Promise<{ success: boolean; error?: string }>;
  disconnectWallet: () => void;
  callContract: (
    functionName: string,
    functionArgs: any[],
    contractAddress: string,
    contractName: string
  ) => Promise<{ success: boolean; txId?: string; error?: string }>;
  transferSTX: (recipient: string, amount: number, memo?: string) => Promise<{ success: boolean; txId?: string; error?: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stxBalance, setStxBalance] = useState(0);
  const [userSession] = useState(() => new UserSession({
    appConfig: new AppConfig(['store_write', 'publish_data'])
  }));

  // Check authentication status on mount
  useEffect(() => {
    console.log('Checking initial authentication status...');
    if (userSession.isUserSignedIn()) {
      console.log('User is already signed in');
      const userData = userSession.loadUserData();
      console.log('Initial user data:', userData);
      setIsWalletConnected(true);
      const address = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
      console.log('Initial address:', address);
      setWalletAddress(address);
      if (address) {
        fetchBalance(address);
      }
    } else {
      console.log('User is not signed in');
    }
  }, [userSession]);

  const fetchBalance = async (address: string) => {
    try {
      console.log('Fetching balance for address:', address);
      
      // Use the correct Stacks testnet API endpoint
      const apiUrl = `https://api.testnet.hiro.so/extended/v1/address/${address}/balances`;
      console.log('Full API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('Balance API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Balance data:', data);
        
        const balance = Number(data.stx.balance) / 1000000; // Convert microSTX to STX
        console.log('Parsed balance:', balance);
        setStxBalance(balance);
      } else {
        console.error('Balance API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      // Fallback: Set a default balance for testing
      console.log('Setting fallback balance for testing...');
      setStxBalance(10); // 10 STX for testing
    }
  };

  const connectWallet = async () => {
    try {
      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        authenticate({
          appDetails: {
            name: 'Matrix Dash',
            icon: window.location.origin + '/favicon.ico'
          },
          redirectTo: '/',
          onFinish: () => {
            // Authentication successful
            setTimeout(() => {
              if (userSession.isUserSignedIn()) {
                const userData = userSession.loadUserData();
                console.log('User data after authentication:', userData);
                console.log('Profile data:', userData.profile);
                console.log('STX addresses:', userData.profile.stxAddress);
                
                setIsWalletConnected(true);
                const address = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
                console.log('Selected address:', address);
                setWalletAddress(address);
                if (address) {
                  fetchBalance(address);
                } else {
                  console.error('No address found in user data');
                }
                resolve({ success: true });
              } else {
                resolve({ success: false, error: 'Authentication failed' });
              }
            }, 100);
          },
          onCancel: () => {
            resolve({ success: false, error: 'User cancelled connection' });
          },
          userSession
        });
      });
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to connect wallet' 
      };
    }
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setIsWalletConnected(false);
    setWalletAddress(null);
    setStxBalance(0);
  };

  const callContract = async (
    functionName: string,
    functionArgs: any[],
    contractAddress: string,
    contractName: string
  ) => {
    try {
      if (!isWalletConnected || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      console.log('Contract call details:', {
        contract: `${contractAddress}.${contractName}`,
        functionName,
        functionArgs,
        walletAddress
      });

      // Convert function arguments to proper Clarity values
      const formattedArgs = functionArgs.map(arg => {
        if (typeof arg === 'number') {
          return uintCV(arg);
        } else if (typeof arg === 'string') {
          if (arg.startsWith('SP') || arg.startsWith('ST')) {
            return principalCV(arg);
          } else if (arg.startsWith('0x')) {
            // Handle hex strings as buffers (for game session hash and signatures)
            const hexData = arg.slice(2); // Remove '0x' prefix
            const buffer = new Uint8Array(hexData.length / 2);
            for (let i = 0; i < hexData.length; i += 2) {
              buffer[i / 2] = parseInt(hexData.substr(i, 2), 16);
            }
            return bufferCV(buffer);
          } else {
            return stringAsciiCV(arg);
          }
        }
        // Default to string if unknown type
        return stringAsciiCV(String(arg));
      });

      console.log('Formatted arguments:', formattedArgs);

      return new Promise<{ success: boolean; txId?: string; error?: string }>((resolve) => {
        openContractCall({
          network,
          contractAddress,
          contractName,
          functionName,
          functionArgs: formattedArgs,
          postConditionMode: PostConditionMode.Allow,
          onFinish: (data) => {
            console.log('Transaction successful:', data);
            resolve({ 
              success: true, 
              txId: data.txId 
            });
          },
          onCancel: () => {
            resolve({ 
              success: false, 
              error: 'User cancelled transaction' 
            });
          }
        });
      });

    } catch (err: any) {
      console.error('Contract call error:', err);
      return { 
        success: false, 
        error: err.message || 'Contract call failed' 
      };
    }
  };

  const transferSTX = async (recipient: string, amount: number, memo?: string) => {
    try {
      if (!isWalletConnected) {
        throw new Error('Wallet not connected');
      }

      return new Promise<{ success: boolean; txId?: string; error?: string }>((resolve) => {
        openSTXTransfer({
          network,
          recipient,
          amount: (amount * 1000000).toString(), // Convert STX to microSTX
          memo,
          onFinish: (data) => {
            resolve({ 
              success: true, 
              txId: data.txId 
            });
          },
          onCancel: () => {
            resolve({ 
              success: false, 
              error: 'User cancelled transfer' 
            });
          }
        });
      });

    } catch (err: any) {
      console.error('STX transfer error:', err);
      return { 
        success: false, 
        error: err.message || 'STX transfer failed' 
      };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected: isWalletConnected,
        walletAddress,
        stxBalance,
        connectWallet,
        disconnectWallet,
        callContract,
        transferSTX,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};