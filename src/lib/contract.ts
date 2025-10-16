import { cvToJSON, deserializeCV } from '@stacks/transactions';

const CONTRACT_ADDRESS = "STNR55Y7QR9QHY5HW83D6JCEDWSX01P1R14ZQ27V.main2";
const CONTRACT_PRINCIPAL = "STNR55Y7QR9QHY5HW83D6JCEDWSX01P1R14ZQ27V";
const CONTRACT_NAME = "main2";

export const contract = {
  address: CONTRACT_ADDRESS,
  principal: CONTRACT_PRINCIPAL,
  name: CONTRACT_NAME,
};

// Contract API for reading data from the blockchain
export const contractAPI = {
  // Read-only contract calls that don't require wallet connection
  getTournament: async (tournamentId: number) => {
    try {
      console.log(`🔍 Fetching tournament ${tournamentId} using fetch...`);
      
      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_PRINCIPAL}/${CONTRACT_NAME}/get-tournament`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [`0x0100000000000000000000000000${tournamentId.toString(16).padStart(6, '0')}`]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Raw tournament ${tournamentId} response:`, data);
        
        // Parse the hex result: first deserialize hex to CV, then convert to JSON
        if (data.result) {
          console.log(`Hex data to parse for tournament ${tournamentId}:`, data.result);
          // Remove '0x' prefix and convert hex to Uint8Array (browser-compatible)
          const hexData = data.result.startsWith('0x') ? data.result.slice(2) : data.result;
          
          // Convert hex string to Uint8Array
          const hexBytes = new Uint8Array(hexData.length / 2);
          for (let i = 0; i < hexData.length; i += 2) {
            hexBytes[i / 2] = parseInt(hexData.substr(i, 2), 16);
          }
          
          // Deserialize to Clarity Value
          const clarityValue = deserializeCV(hexBytes);
          console.log(`Deserialized CV for tournament ${tournamentId}:`, clarityValue);
          
          // Convert to JSON
          const parsedResult = cvToJSON(clarityValue);
          console.log(`Parsed tournament ${tournamentId}:`, parsedResult);
          return parsedResult;
        }
        return null;
      } else {
        console.warn('Failed to fetch tournament data, status:', response.status);
        const errorText = await response.text();
        console.warn('Error response:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      return null;
    }
  },

  getParticipant: async (tournamentId: number, playerAddress: string) => {
    try {
      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_PRINCIPAL}/${CONTRACT_NAME}/get-participant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [
            `0x0100000000000000000000000000${tournamentId.toString(16).padStart(6, '0')}`,
            `0x051a${playerAddress.slice(2)}`
          ]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        console.warn('Failed to fetch participant data, status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching participant:', error);
      return null;
    }
  },

  getPlayerStats: async (playerAddress: string) => {
    try {
      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_PRINCIPAL}/${CONTRACT_NAME}/get-player-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [`0x051a${playerAddress.slice(2)}`]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        console.warn('Failed to fetch player stats, status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  },

  getContractStats: async () => {
    try {
      console.log(' Fetching contract stats using fetch...');
      
      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_PRINCIPAL}/${CONTRACT_NAME}/get-contract-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: []
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw contract stats response:', data);
        
        // Parse the hex result: first deserialize hex to CV, then convert to JSON
        if (data.result) {
          console.log('Hex data to parse:', data.result);
          // Remove '0x' prefix and convert hex to Uint8Array (browser-compatible)
          const hexData = data.result.startsWith('0x') ? data.result.slice(2) : data.result;
          
          // Convert hex string to Uint8Array
          const hexBytes = new Uint8Array(hexData.length / 2);
          for (let i = 0; i < hexData.length; i += 2) {
            hexBytes[i / 2] = parseInt(hexData.substr(i, 2), 16);
          }
          
          // Deserialize to Clarity Value
          const clarityValue = deserializeCV(hexBytes);
          console.log('Deserialized CV:', clarityValue);
          
          // Convert to JSON
          const parsedResult = cvToJSON(clarityValue);
          console.log('Parsed contract stats:', parsedResult);
          return parsedResult;
        }
        return null;
      } else {
        console.warn('Failed to fetch contract stats, status:', response.status);
        const errorText = await response.text();
        console.warn('Error response:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching contract stats:', error);
      return null;
    }
  },

  isTournamentActive: async (tournamentId: number) => {
    try {
      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_PRINCIPAL}/${CONTRACT_NAME}/is-tournament-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [`0x0100000000000000000000000000${tournamentId.toString(16).padStart(6, '0')}`]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        console.warn('Failed to check tournament status, status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error checking tournament status:', error);
      return false;
    }
  },

  getTournamentConstants: async () => {
    return {
      min_entry_price: 1000000,
      min_pool_contribution: 5000000,
      winners_percentage: 80,
      treasury_percentage: 10,
      burn_percentage: 10
    };
  },

  getLeaderboardPosition: async (tournamentId: number, rank: number) => {
    try {
      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_PRINCIPAL}/${CONTRACT_NAME}/get-leaderboard-position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [
            `0x0100000000000000000000000000${tournamentId.toString(16).padStart(6, '0')}`,
            `0x0100000000000000000000000000${rank.toString(16).padStart(6, '0')}`
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching leaderboard position:', error);
      return null;
    }
  },

  getTournamentWinners: async (tournamentId: number) => {
    try {
      const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_PRINCIPAL}/${CONTRACT_NAME}/get-tournament-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [`0x0100000000000000000000000000${tournamentId.toString(16).padStart(6, '0')}`]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching tournament winners:', error);
      return null;
    }
  },
};