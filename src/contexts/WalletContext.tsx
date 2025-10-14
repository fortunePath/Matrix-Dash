import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Leather wallet provider types
declare global {
  interface Window {
    LeatherProvider?: {
      request: (method: string, params?: any) => Promise<any>;
    };
  }
}

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  stxBalance: number;
  isLeatherInstalled: boolean;
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
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stxBalance, setStxBalance] = useState(0);
  const [isLeatherInstalled, setIsLeatherInstalled] = useState(false);

  // Check if Leather is installed
  useEffect(() => {
    const checkLeather = () => {
      setIsLeatherInstalled(!!window.LeatherProvider);
    };
    
    // Check immediately
    checkLeather();
    
    // Also check after a delay in case the extension loads later
    const timer = setTimeout(checkLeather, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.LeatherProvider) {
        return { 
          success: false, 
          error: 'Leather wallet not installed. Please install it from https://leather.io' 
        };
      }

      console.log('Connecting to Leather wallet...');
      
      // Get addresses from Leather
      const addressResponse = await window.LeatherProvider.request('getAddresses');
      
      console.log('Address response:', addressResponse);
      
      // Handle different possible response formats
      let addresses = null;
      if (addressResponse?.result?.addresses) {
        addresses = addressResponse.result.addresses;
      } else if (addressResponse?.addresses) {
        addresses = addressResponse.addresses;
      } else if (Array.isArray(addressResponse)) {
        addresses = addressResponse;
      }
      
      if (addresses) {
        // Look for Stacks address with different possible type names
        const stacksAddress = addresses.find(
          (addr: any) => addr.type === 'stacks' || addr.type === 'stx' || addr.symbol === 'STX'
        );
        
        console.log('Found addresses:', addresses);
        console.log('Stacks address:', stacksAddress);
        
        if (stacksAddress && stacksAddress.address) {
          setIsConnected(true);
          setWalletAddress(stacksAddress.address);
          
          // Try to get STX balance
          try {
            const balanceResponse = await window.LeatherProvider.request('stx_getBalance', {
              address: stacksAddress.address
            });
            
            console.log('Balance response:', balanceResponse);
            
            if (balanceResponse && balanceResponse.result) {
              // Convert microSTX to STX
              const balance = Number(balanceResponse.result.balance || balanceResponse.result.total || 0) / 1000000;
              setStxBalance(balance);
            } else if (balanceResponse && typeof balanceResponse.balance !== 'undefined') {
              const balance = Number(balanceResponse.balance) / 1000000;
              setStxBalance(balance);
            } else {
              // Fallback: fetch balance using Stacks API
              const apiResponse = await fetch(`https://stacks-node-api.testnet.stacks.co/extended/v1/address/${stacksAddress.address}/balances`);
              if (apiResponse.ok) {
                const balanceData = await apiResponse.json();
                const balance = Number(balanceData.stx.balance) / 1000000;
                setStxBalance(balance);
              } else {
                setStxBalance(0);
              }
            }
          } catch (balanceError) {
            console.warn('Could not fetch STX balance:', balanceError);
            // Fallback: fetch balance using Stacks API
            try {
              const apiResponse = await fetch(`https://stacks-node-api.testnet.stacks.co/extended/v1/address/${stacksAddress.address}/balances`);
              if (apiResponse.ok) {
                const balanceData = await apiResponse.json();
                const balance = Number(balanceData.stx.balance) / 1000000;
                setStxBalance(balance);
              } else {
                setStxBalance(0);
              }
            } catch (apiError) {
              console.error('Failed to fetch balance from API:', apiError);
              setStxBalance(0);
            }
          }
          
          return { success: true };
        } else {
          console.error('Available addresses:', addresses);
          return { success: false, error: 'No Stacks address found in wallet. Please make sure your Leather wallet has a Stacks account.' };
        }
      } else {
        console.error('No addresses in response:', addressResponse);
        return { success: false, error: 'Failed to get addresses from wallet' };
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to connect wallet' 
      };
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
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
      if (!window.LeatherProvider) {
        throw new Error('Leather wallet not available');
      }

      if (!isConnected || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Use Clarity CV format for function arguments
      const response = await window.LeatherProvider.request('stx_callContract', {
        contract: `${contractAddress}.${contractName}`,
        functionName: functionName,
        functionArgs: functionArgs.map(arg => {
          if (typeof arg === 'number') {
            // Use hex format for uint
            return `0x${arg.toString(16).padStart(16, '0')}`;
          }
          return String(arg);
        })
      });

      if (response && response.result) {
        return { 
          success: true, 
          txId: response.result.txId || response.result.transaction_id 
        };
      } else {
        throw new Error('Contract call failed');
      }
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
      if (!window.LeatherProvider) {
        throw new Error('Leather wallet not available');
      }

      if (!isConnected) {
        throw new Error('Wallet not connected');
      }

      const response = await window.LeatherProvider.request('stx_transferStx', {
        recipient,
        amount: (amount * 1000000).toString(), // Convert STX to microSTX
        memo: memo || ''
      });

      if (response && response.result) {
        return { 
          success: true, 
          txId: response.result.txId || response.result.transaction_id 
        };
      } else {
        throw new Error('Transfer failed');
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      return { 
        success: false, 
        error: err.message || 'Transfer failed' 
      };
    }
  };

  const value = {
    isConnected,
    walletAddress,
    stxBalance,
    isLeatherInstalled,
    connectWallet,
    disconnectWallet,
    callContract,
    transferSTX,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};