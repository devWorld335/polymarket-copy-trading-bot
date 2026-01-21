<div align="center">

# 🤖 Polymarket Copy Trading Bot

**Automate Your Prediction Market Trading**

*Mirror the moves of top Polymarket traders automatically*

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

**📞 Support:** [Telegram @u_known1111](https://t.me/u_known1111)

[Getting Started](#-getting-started) • [Features](#-what-you-get) • [Configuration](#-configure)

---

</div>

## 🎯 What Is This?

Ever wanted to trade like the pros on Polymarket but don't have the time or expertise? This bot does the heavy lifting for you.

**In simple terms:** Pick successful traders, and the bot automatically copies their trades to your wallet with proportional sizing based on your capital.

<img width="995" height="691" alt="screenshot" src="./docs/Screenshot_1.png" />

---

## ✨ What You Get

### Core Capabilities

✅ **Follow Multiple Traders** - Track several traders at once for diversification  
✅ **Smart Sizing** - Automatically scales positions to match your wallet size  
✅ **Real-Time Execution** - Trades execute within seconds of detection  
✅ **Position Tracking** - Never lose track of your positions, even after balance changes  
✅ **Trade Aggregation** - Combines small trades for better execution  
✅ **MongoDB Storage** - Complete trade history and analytics  
✅ **Price Protection** - Built-in safeguards against bad fills  

### Advanced Features

🔹 **Tiered Multipliers** - Apply different multipliers based on trade size  
🔹 **Configurable Strategies** - Percentage, fixed amount, or adaptive sizing  
🔹 **RTDS Support** - Real-time data stream monitoring (Version 2)  
🔹 **Customizable Settings** - Fine-tune every aspect of bot behavior  

---

## 🚀 Getting Started

### Before You Begin

You'll need:

- ✅ Node.js 18 or higher
- ✅ A Polygon wallet (MetaMask works great)
- ✅ USDC on Polygon for trading capital
- ✅ POL/MATIC for gas fees (~$5-10)
- ✅ MongoDB database (free tier available at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register))
- ✅ RPC endpoint (free from [Infura](https://infura.io) or [Alchemy](https://www.alchemy.com))

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/0xRustElite1111/polymarket-copy-trading-bot.git
cd polymarket-copy-trading-bot

# 2. Install dependencies
npm install

# 3. Run the setup wizard (creates .env file)
npm run setup

# 4. Build the project
npm run build

# 5. Verify your configuration
npm run health-check

# 6. Start trading!
npm start
```

> 💡 **New to this?** Check out the [Getting Started Guide](./docs/GETTING_STARTED.md) for detailed instructions.

---

## ⚙️ Configure

### Required Environment Variables

Create a `.env` file with these settings:

```env
# Your Wallet
PROXY_WALLET=0xYourWalletAddress
PRIVATE_KEY=your_private_key_without_0x

# Traders to Copy (comma-separated or JSON array)
USER_ADDRESSES=0xTrader1,0xTrader2

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Network
RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY

# Optional: Trading Settings
TRADE_MULTIPLIER=1.0
FETCH_INTERVAL=1
```

### Finding Good Traders

1. Check the [Polymarket Leaderboard](https://polymarket.com/leaderboard)
2. Look for traders with:
   - Positive P&L over time
   - Win rate above 55%
   - Consistent, active trading
3. Verify details on [Predictfolio](https://predictfolio.com)
4. Add their wallet addresses to `USER_ADDRESSES`

> 📚 See the [Quick Start Guide](./docs/QUICK_START.md) for complete configuration details.

---

## 🐳 Docker Setup

Run the bot in a container:

```bash
# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f polymarket
```

> 🐳 Full Docker guide: [DOCKER.md](./docs/DOCKER.md)

---

## 🛡️ Safety First

### ⚠️ Important Warnings

- **Real Money, Real Risk** - This bot executes actual trades with your funds
- **Start Small** - Test with minimal amounts first
- **Diversify** - Don't put all your eggs in one trader's basket
- **Monitor Daily** - Check logs regularly to ensure proper operation
- **No Guarantees** - Past performance ≠ future results

### Best Practices

1. **Use a separate wallet** - Don't use your main wallet
2. **Risk only what you can lose** - Never trade with funds you need
3. **Research traders** - Do your due diligence before following
4. **Set up monitoring** - Know what's happening with your trades
5. **Learn the stop command** - Ctrl+C stops the bot immediately

---

## 📚 Documentation

### Guides

| Guide | Description |
|-------|-------------|
| [🚀 Getting Started](./docs/GETTING_STARTED.md) | Step-by-step beginner tutorial |
| [⚡ Quick Start](./docs/QUICK_START.md) | Fast setup for experienced users |
| [👥 Multi-Trader Setup](./docs/MULTI_TRADER_GUIDE.md) | Copy multiple traders simultaneously |
| [📍 Position Tracking](./docs/POSITION_TRACKING.md) | How position tracking works |
| [💰 Funding Guide](./docs/FUNDING_GUIDE.md) | Wallet funding instructions |

### Advanced Topics

| Topic | Description |
|-------|-------------|
| [🐳 Docker Deployment](./docs/DOCKER.md) | Container deployment guide |
| [🧪 Simulation Guide](./docs/SIMULATION_GUIDE.md) | Backtest trading strategies |
| [🔬 Simulation Runner](./docs/SIMULATION_RUNNER_GUIDE.md) | Advanced backtesting tools |

---

## 🔧 Troubleshooting

### Quick Fixes

| Issue | Solution |
|-------|----------|
| Missing environment variables | Run `npm run setup` |
| MongoDB connection fails | Check `MONGO_URI`, whitelist your IP |
| Bot not detecting trades | Verify trader addresses, check recent activity |
| Insufficient balance | Add USDC and ensure POL/MATIC for gas |
| Configuration issues | Run `npm run health-check` |

For more help, see the [Quick Start Guide](./docs/QUICK_START.md) troubleshooting section.

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit: `git commit -m 'Add awesome feature'`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

---

## 📄 License

ISC License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [Polymarket CLOB Client](https://github.com/Polymarket/clob-client)
- Trader analytics powered by [Predictfolio](https://predictfolio.com)
- Running on Polygon network

---


## ⚖️ Disclaimer

This software is provided for **educational purposes only**. Trading involves risk of financial loss. The developers and contributors are not responsible for any financial losses incurred while using this bot. Use at your own risk and only trade with funds you can afford to lose.

---

<div align="center">

**Made with ❤️ for the Polymarket community**

[⭐ Star this repo](https://github.com/0xRustElite1111/polymarket-copy-trading-bot) if you find it useful!

</div>
