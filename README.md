# DexLP - Liquidity Provisioning Dashboard for Gnosis Chain

A comprehensive dashboard for managing SushiSwap USDC/DAI liquidity positions on Gnosis Chain. Monitor your LP positions, track impermanent loss, and manage liquidity with ease.

## Project Goal

DexLP simplifies liquidity provisioning on Gnosis Chain by providing:

- **Real-time Position Monitoring**: Track your LP positions with live NAV (Net Asset Value) calculations
- **Impermanent Loss Analysis**: Monitor and visualize impermanent loss over time
- **Easy Liquidity Management**: Add or remove liquidity with a user-friendly interface
- **Multi-wallet Support**: Track multiple wallet addresses in your watchlist
- **Local Data Storage**: All snapshots and data stored locally in your browser

##  Features

### Core Functionality
- **Position Tracking**: Monitor USDC/DAI LP positions on Gnosis
- **NAV Calculations**: Real-time Net Asset Value tracking
- **Impermanent Loss Monitoring**: Track IL with automated snapshots every 15 minutes
- **Liquidity Management**: Add/remove liquidity directly from the interface
- **Wallet Integration**: Connect via MetaMask or WalletConnect

### Technical Features
- **Next.js 14**: Modern React framework with App Router
- **Wagmi + Viem**: Ethereum interaction library
- **Web3Modal**: Wallet connection management
- **Zustand**: State management
- **Tailwind CSS**: Modern styling
- **TypeScript**: Type-safe development

##  Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DexLP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id" > .env.local
   ```
   
   > **Note**: Get your WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com/)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage Guide

### Getting Started

1. **Connect Your Wallet**
   - Click the "Connect Wallet" button
   - Choose MetaMask or WalletConnect
   - Approve the connection

2. **Add Wallet Addresses**
   - Enter any wallet address in the input field
   - Click "Add" to add it to your watchlist
   - Or use "Use connected wallet" for your current wallet

3. **Monitor LP Positions**
   - Navigate to `/wallet/[address]` to view detailed position data
   - See real-time NAV, impermanent loss, and reserves
   - View historical snapshots and charts

### Managing Liquidity

1. **Add Liquidity**
   - Go to `/lp` page
   - Enter USDC and DAI amounts
   - Approve tokens if needed
   - Confirm the transaction

2. **Remove Liquidity**
   - Select the percentage to remove
   - Choose minimum amounts to receive
   - Confirm the transaction

### Understanding the Data

- **NAV (Net Asset Value)**: Current value of your LP position
- **Impermanent Loss**: Loss due to price divergence between tokens
- **Reserves**: Current USDC and DAI amounts in the pool
- **Share Percentage**: Your share of the total liquidity pool

## 🔧 Configuration

### Environment Variables

```bash
# Required for WalletConnect functionality
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
```

### Supported Networks

- **Gnosis Chain (Chain ID: 100)**
  - Native currency: xDAI
  - RPC: https://rpc.gnosischain.com
  - Explorer: https://gnosisscan.io

### Contract Addresses

The application uses these SushiSwap contracts on Gnosis:

- **Router**: `0x1b02da8cb0d097eb8d57a175b88c7d8b47997506`
- **Factory**: `0xc35dadb65012ec5796536bd9864ed8773abc74c4`
- **USDC**: `0xddafbb505ad214d7b80b1f830fcc89b6063be975`
- **DAI**: `0x44fA8E6f47987339850626F86470146305009c8B`

## Data Storage

All data is stored locally in your browser:

- **LP Snapshots**: Stored every 15 minutes automatically
- **Watchlist**: Saved wallet addresses
- **Transaction History**: Local fill tracking

## 🚨 Important Notes

### Security
- **Local Storage**: Data is stored locally - clear browser data to reset

### Limitations
- **Gnosis Chain Only**: Currently supports Gnosis Chain
- **USDC/DAI Pair**: Limited to USDC/DAI liquidity pair
- **Browser Storage**: Data is not synced across devices

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

### Project Structure

```
DexLP/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── providers/          # React context providers
└── store/              # Zustand state management
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Ensure you're connected to Gnosis Chain
3. Verify your wallet has sufficient xDAI for gas fees
4. Check that the environment variables are set correctly

## Useful Links

- [Gnosis Chain Documentation](https://docs.gnosischain.com/)
- [SushiSwap on Gnosis](https://gnosis.sushi.com/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Wagmi Documentation](https://wagmi.sh/)

---
