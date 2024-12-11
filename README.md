# snapshot your ERC20 token
This repo can help you take snap shot of an erc20 token onchain.

Prerequisites
-------------

*   **Node.js**: Ensure you have Node.js (version 12 or higher) installed on your machine.
    
*   **npm**: Node Package Manager comes with Node.js and is used to install dependencies.
    
*   **Alchemy API Keys**: Sign up at [Alchemy](https://www.alchemy.com/) to obtain API keys for the Ethereum and Polygon networks.
    
*   **CoinGecko API Key**: Sign up at CoinGecko to obtain an API key for fetching historical price data.
    

Installation
------------

```bash
git clone https://github.com/yourusername/erc20-snapshot.git
cd erc20-snapshot
```

### Install Dependencies
```bash
npm install
```
This command installs all the packages listed in package.json.
    

Configuration
-------------

### Environment Variables

Create a ```.env``` file in the root directory of the project to store your API keys and other environment-specific variables.
```bash
codetouch .env
```

Add the following content to your .env file:
```bash
# Alchemy API URLs  
ALCHEMY_ETH_MAINNET_URL=https://eth-mainnet.alchemyapi.io/v2/your-eth-api-key  ALCHEMY_POLYGON_MAINNET_URL=https://polygon-mainnet.g.alchemy.com/v2/your-polygon-api-key  
# CoinGecko API Key  
COINGECKO_API_KEY=your-coingecko-api-key
```


**Important**: Replace your-eth-api-key, your-polygon-api-key, and your-coingecko-api-key with your actual API keys.

### Network Configuration

In the snapshot.js script, you can configure the networks you wish to use. By default, the script supports Ethereum and Polygon networks.

```javascript
const networkConfig = {
  ethereum: {
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ALCHEMY_ETH_MAINNET_URL,
  },
  polygon: {
    name: 'Polygon Mainnet',
    rpcUrl: process.env.ALCHEMY_POLYGON_MAINNET_URL,
  },
  // Add additional networks or testnets as needed
};

```

To switch networks, modify the networkChoice variable:

```javascript
const networkChoice = 'ethereum'; // Change to 'polygon' or other networks as needed
```

### Snapshot Time

Set the snapshotTimestamp to the desired date and time for the snapshot. The time should be in UTC.

```javascript
// Snapshot Time (Unix Timestamp)
const snapshotTimestamp = Math.floor(new Date('2024-10-20T00:00:00Z').getTime() / 1000); // Adjust as needed
const snapshotDate = new Date(snapshotTimestamp * 1000);
```

### Token Contract Address

Set the ERC20 token contract address for which you want to take the snapshot.

```javascript
// Snapshot Time (Unix Timestamp)
const snapshotTimestamp = Math.floor(new Date('2024-10-20T00:00:00Z').getTime() / 1000); // Adjust as needed
const snapshotDate = new Date(snapshotTimestamp * 1000);
```

**Note**: Ensure you also update the ```fromBlock``` variable with the block number when the token contract was deployed. This optimizes the script by fetching events only from relevant blocks.

```javascript
const fromBlock = 11390168; // Replace with the actual deployment block number
```


Usage
-----

### Running the Script

Run the script using the following command:

```bash
node snapshot.js
```

### Scheduling Snapshots (this is optional and it's not included in the current code and it's not tested)

To run the script at a specific time or on a schedule, you can use:

*   **Cron Jobs (Linux/MacOS)**
    
*   **Task Scheduler (Windows)**
    
*   **```node-cron``` Package**: The script includes the node-cron package for scheduling within Node.js.
    

**Example**: Schedule the script to run every day at midnight.

```javascript
const cron = require('node-cron');

cron.schedule('0 0 * * *', () => {
  main().catch((error) => {
    console.error('Error:', error);
  });
});
```

Modify the cron schedule expression as needed.

Understanding the Script
------------------------

### Main Components

*   **Provider Initialization**: Connects to the blockchain network using Alchemy's RPC URLs.
    
*   **Fetching Transfer Events**: Retrieves all Transfer events from the token's deployment block up to the snapshot block.
    
*   **Calculating Balances**: Processes events to calculate each address's token balance at the snapshot time.
    
*   **Fetching Historical Price**: Retrieves the token's price at the snapshot time using CoinGecko's API.
    
*   **Saving Data**: Outputs the snapshot data to JSON and CSV files.
    

### Fetching Historical Price

The script includes a function to fetch the token's historical price from CoinGecko.

```javascript
async function getHistoricalPrice(tokenId, snapshotDate) {
  // ...function code...
}
```

Ensure you replace tokenId with your token's CoinGecko ID.

Output Files
------------

The script generates two output files in the project directory:

1. JSON File: balances_[network].json

```json
{
  "snapshotTimestamp": 1729382400,
  "priceUSD": 1.23,
  "balances": {
    "0xAddress1": "1000000000000000000",
    "0xAddress2": "500000000000000000"
    // ...
  }
}
```
2. CSV File: balances_[network].csv
```csv
Address,Balance
0xAddress1,1000000000000000000
0xAddress2,500000000000000000
// ...
```

**Note**: The balances are in the smallest unit (wei). You may convert them to standard units using the token's decimals value.

Troubleshooting
---------------

*   **Script Running Slowly**: Ensure the tokenDeploymentBlock is correctly set to avoid processing unnecessary blocks.
    
*   **API Rate Limits**: Be mindful of rate limits imposed by Alchemy and CoinGecko. Consider implementing delays or upgrading your API plans if necessary.
    
*   **Invalid API Keys**: Double-check your API keys in the .env file.
    
*   **Future Timestamp Error**: Ensure the snapshotTimestamp is set to a past date relative to the current blockchain state.
    
*   **Token Not Listed on CoinGecko**: If your token is not listed, the script cannot fetch its historical price from CoinGecko.
    

Contributing
------------

Contributions are welcome! Please fork the repository and create a pull request with your changes.

License
-------

This project is licensed under the MIT License. See the LICENSE file for details.


