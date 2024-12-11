require('dotenv').config();
const axios = require('axios');

const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  // Configuration
  const networkConfig = {
    ethereum: {
      name: 'Ethereum Mainnet',
      rpcUrl: process.env.ALCHEMY_ETH_MAINNET_URL,
    },
    ethereum_sepolia: {
      name: 'Ethereum Sepolia Testnet',
      rpcUrl: process.env.ALCHEMY_ETH_SEPOLIA_URL,
    },
    polygon: {
      name: 'Polygon Mainnet',
      rpcUrl: process.env.ALCHEMY_POLYGON_MAINNET_URL,
    },
    polygon_amoy: {
      name: 'Polygon Amoy Testnet',
      rpcUrl: process.env.ALCHEMY_POLYGON_AMOY_URL,
    },
    // Add testnet configurations here
  };

  // Select Network
  const networkChoice = 'polygon'; // Change to 'polygon' or other networks as needed
  const network = networkConfig[networkChoice];

  // Initialize Provider
  const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);

  // ERC20 Token Contract Address
  //const tokenAddress = '0xB2dbF14D0b47ED3Ba02bDb7C954e05A72deB7544'; //ethereum
  const tokenAddress = '0xF689E85988d3a7921E852867CE49F53388985E6d'; //polygon
  // ERC20 ABI (Minimal)
  const tokenAbi = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'function decimals() view returns (uint8)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
  ];

  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

  // Snapshot Time (Unix Timestamp), it can take snapshot in the past if you set the time so
  const snapshotTimestamp = Math.floor(new Date('2024-12-01T00:00:00Z').getTime() / 1000); // Change to desired time
  const snapshotDate = new Date(snapshotTimestamp * 1000);

  // Check if snapshotTimestamp is in the future
const latestBlock = await provider.getBlock('latest');
if (snapshotTimestamp > latestBlock.timestamp) {
  console.error('Error: snapshotTimestamp is in the future. Please set it to a past time.');
  return;
}

  // Get Historical Price
 const tokenId = 'mobifi'; // Replace with your token's CoinGecko ID
 const priceUSD = await getHistoricalPrice(tokenId, snapshotDate);

 if (priceUSD !== null) {
   console.log(`Token price at snapshot time: $${priceUSD}`);
 } else {
   console.log('Historical price data is unavailable.');
 }


  // Get Block Number at Snapshot Time
  const snapshotBlock = await getBlockNumberAtTimestamp(provider, snapshotTimestamp);

  console.log(`Taking snapshot at block number: ${snapshotBlock}`);

  // Get Transfer Events
  const transferEvents = await getTransferEvents(tokenContract, snapshotBlock);

  console.log(`Total Transfer Events Retrieved: ${transferEvents.length}`);

  // Process Events to Get Balances
  const balances = await calculateBalances(transferEvents);

  console.log(`Total Addresses Holding Token: ${Object.keys(balances).length}`);

  // Save Data to JSON and CSV Files
  await saveData(balances, networkChoice);

  console.log('Snapshot data saved successfully.');
}

// Helper Functions

// this getHistoryicalPrice is called to fetch token price using Coingeko api
async function getHistoricalPrice(tokenId, snapshotDate) {
  const formattedDate = snapshotDate.toLocaleDateString('en-GB').split('/').reverse().join('-');
  const dateString = formattedDate.split('-').reverse().join('-'); // dd-mm-yyyy
  const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/history?date=${dateString}&localization=false`;

  try {
    const response = await axios.get(url, {
      headers: {
        'x_cg_demo_api_key': process.env.COINGECKO_API_KEY,
      },
    });
    const data = response.data;

    if (data.market_data && data.market_data.current_price) {
      const priceUSD = data.market_data.current_price.usd;
      return priceUSD;
    } else {
      throw new Error('Price data not available for this date.');
    }
  } catch (error) {
    console.error('Error fetching historical price:', error.message);
    return null;
  }
}

async function getBlockNumberAtTimestamp(provider, timestamp) {
  let max = await provider.getBlockNumber();
  let min = 0;
  let blockNumber = Math.floor((max + min) / 2);

  while (min <= max) {
    const block = await provider.getBlock(blockNumber);
    if (block.timestamp === timestamp) {
      return blockNumber;
    } else if (block.timestamp < timestamp) {
      min = blockNumber + 1;
    } else {
      max = blockNumber - 1;
    }
    blockNumber = Math.floor((max + min) / 2);
  }

  return blockNumber;
}

async function getTransferEvents(tokenContract, toBlock) {
  const fromBlock = 12965303; // You can set this to the block when the token was created to optimize, the token is deployed at block 12183386.
 
  

  const transferEvents = [];

  const filter = tokenContract.filters.Transfer();

  // Due to limitations on the number of blocks, we need to batch the requests
  const batchSize = 5000; // Adjust based on network limits
  for (let i = fromBlock; i <= toBlock; i += batchSize) {
    const endBlock = Math.min(i + batchSize - 1, toBlock);
    console.log(`Fetching events from block ${i} to ${endBlock}`);

    const events = await tokenContract.queryFilter(filter, i, endBlock);
    transferEvents.push(...events);
  }

  return transferEvents;
}

async function calculateBalances(transferEvents) {
  const balances = {};

  for (const event of transferEvents) {
    const { from, to, value } = event.args;

    // Subtract from sender
    if (from !== ethers.constants.AddressZero) {
      balances[from] = (balances[from] || ethers.BigNumber.from(0)).sub(value);
    }

    // Add to recipient
    if (to !== ethers.constants.AddressZero) {
      balances[to] = (balances[to] || ethers.BigNumber.from(0)).add(value);
    }
  }

  // Convert BigNumber balances to strings for JSON serialization
  const formattedBalances = {};
  for (const [address, balance] of Object.entries(balances)) {
    if (!balance.isZero()) {
      formattedBalances[address] = balance.toString();
    }
  }

  return formattedBalances;
}

async function saveData(balances, networkChoice) {
  const jsonContent = JSON.stringify(balances, null, 2);
  fs.writeFileSync(`balances_${networkChoice}.json`, jsonContent);

  // Convert to CSV
  const csvLines = ['Address,Balance'];
  for (const [address, balance] of Object.entries(balances)) {
    csvLines.push(`${address},${balance}`);
  }
  const csvContent = csvLines.join('\n');
  fs.writeFileSync(`balances_${networkChoice}.csv`, csvContent);
}

main().catch((error) => {
  console.error('Error:', error);
});
