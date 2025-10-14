const CONTRACT_ADDRESS = "STNR55Y7QR9QHY5HW83D6JCEDWSX01P1R14ZQ27V.main";
const CONTRACT_PRINCIPAL = "STNR55Y7QR9QHY5HW83D6JCEDWSX01P1R14ZQ27V";
const CONTRACT_NAME = "main";

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
      const response = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read/${CONTRACT_ADDRESS}/get-tournament`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [`0x${tournamentId.toString(16).padStart(32, '0')}`] // Convert to uint
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        console.warn('Failed to fetch tournament data');
        return null;
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      return null;
    }
  },

  getParticipant: async (tournamentId: number, playerAddress: string) => {
    try {
      const response = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read/${CONTRACT_ADDRESS}/get-participant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [
            `0x${tournamentId.toString(16).padStart(32, '0')}`, // Convert to uint
            `0x${playerAddress}` // Convert to principal
          ]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        console.warn('Failed to fetch participant data');
        return null;
      }
    } catch (error) {
      console.error('Error fetching participant:', error);
      return null;
    }
  },

  getPlayerStats: async (playerAddress: string) => {
    try {
      const response = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read/${CONTRACT_ADDRESS}/get-player-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [`0x${playerAddress}`] // Convert to principal
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        console.warn('Failed to fetch player stats');
        return null;
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  },

  getContractStats: async () => {
    try {
      const response = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read/${CONTRACT_ADDRESS}/get-contract-stats`, {
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
        return data.result;
      } else {
        console.warn('Failed to fetch contract stats');
        return null;
      }
    } catch (error) {
      console.error('Error fetching contract stats:', error);
      return null;
    }
  },

  isTournamentActive: async (tournamentId: number) => {
    try {
      const response = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read/${CONTRACT_ADDRESS}/is-tournament-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: CONTRACT_PRINCIPAL,
          arguments: [`0x${tournamentId.toString(16).padStart(32, '0')}`] // Convert to uint
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        console.warn('Failed to check tournament status');
        return false;
      }
    } catch (error) {
      console.error('Error checking tournament status:', error);
      return false;
    }
  },

  getTournamentConstants: async () => {
    // These are constants defined in the contract
    return {
      min_entry_price: 1000000, // 1 STX in microSTX
      min_pool_contribution: 5000000, // 5 STX in microSTX
      winners_percentage: 80,
      treasury_percentage: 10,
      burn_percentage: 10
    };
  },
};