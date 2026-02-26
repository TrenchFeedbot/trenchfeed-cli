<p align="center">
  <img src="https://www.trenchfeed.com/logo.png" alt="TrenchFeed" width="360">
</p>

<p align="center">
  <strong>Deploy autonomous AI trading agents on Solana. Watch them trade live.</strong>
  <br>
  <sub>Ghost V2 insider detection &middot; 28+ token filters &middot; Paper & live trading &middot; Real-time stream</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/trenchfeed-cli"><img src="https://img.shields.io/badge/npm-v0.2.0-red" alt="npm"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-green" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Solana-mainnet-9945FF" alt="Solana">
  <img src="https://img.shields.io/badge/strategies-6-orange" alt="6 Strategies">
  <img src="https://img.shields.io/badge/filters-28%2B-blueviolet" alt="28+ Filters">
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#watch-live">Watch Live</a> &middot;
  <a href="#commands">Commands</a> &middot;
  <a href="#strategies">Strategies</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#token-filters">Filters</a> &middot;
  <a href="#api-reference">API</a> &middot;
  <a href="#websocket">WebSocket</a>
</p>

---

TrenchFeed agents autonomously trade Solana memecoins using AI-powered signal analysis, Ghost V2 insider wallet cluster detection, and fully customizable strategies. Deploy via CLI or web dashboard — same capabilities, full config parity. Agents scan PumpFun and Jupiter for new tokens, evaluate them against your filters and risk parameters, and execute trades on-chain (or paper trade for testing).

**Watch your agent think and trade in real-time.** Every decision, every analysis, every trade — streamed live to your terminal or browser via WebSocket. See exactly what your agent is doing, why it's buying or passing on tokens, and how your PnL changes tick by tick.

## Watch Live

The killer feature. Stream your agent's live thought process, trades, and PnL directly in your terminal:

```bash
trenchfeed stream
```

```
[thought] Scanning PumpFun feed... 3 new tokens detected
[thought] Evaluating $BONK2 — mcap $12K, 47 holders, Ghost score 78/100
[thought] Passed all filters. Entry looks good at 0.000012 SOL
[trade]  BUY $BONK2 — 0.25 SOL @ 0.000012
[pnl]    open: +0.0420 SOL | closed: +0.1850 SOL | positions: 2
[thought] $BONK2 up 34% — approaching take profit at 50%
[trade]  SELL $BONK2 — +0.0850 SOL (+34.0%)
[pnl]    open: +0.0000 SOL | closed: +0.2700 SOL | positions: 1
```

You can also **chat with your agent** while it trades:

```bash
trenchfeed chat "What tokens are you watching right now?"
```

Or watch the full live stream in your browser at `trenchfeed.fun/stream/<agentId>` — complete with voice narration, PnL charts, and position management.

## Quick Start

```bash
npm install -g trenchfeed-cli
trenchfeed setup
```

<details>
<summary>From source</summary>

```bash
git clone https://github.com/TrenchFeedbot/trenchfeed-cli.git
cd trenchfeed-cli
npm install
npm run dev -- setup
```
</details>

The setup wizard walks you through wallet connection, strategy selection, risk limits, token filters, Twitter, and voice config. Stores your config at `~/.trenchfeed/cli.json`.

## Commands

| Command | Description |
|---------|-------------|
| `trenchfeed setup` | Interactive agent setup wizard — full config |
| `trenchfeed login` | Reconnect with existing API key |
| `trenchfeed status` | Agent status, PnL, open positions |
| `trenchfeed start` | Start trading |
| `trenchfeed stop` | Stop trading |
| `trenchfeed pause` | Pause trading (keeps positions open) |
| `trenchfeed resume` | Resume paused agent |
| `trenchfeed emergency` | Emergency stop — sells ALL positions immediately |
| `trenchfeed config` | View full agent config |
| `trenchfeed config --set key=value` | Update any config value live |
| `trenchfeed wallet` | Show wallet address + SOL balance |
| `trenchfeed wallet --withdraw <addr> --amount <sol>` | Withdraw SOL to address |
| `trenchfeed trades` | Recent trade history |
| `trenchfeed trades -n 50` | Show last 50 trades |
| `trenchfeed stream` | Live WebSocket stream — thoughts, trades, PnL |
| `trenchfeed chat "message"` | Chat with your agent |
| `trenchfeed logout` | Clear stored credentials |

## Strategies

| Strategy | Description |
|----------|-------------|
| **Ghost Filtered** | Scans with Ghost V2 insider wallet cluster analysis before every trade. Highest safety. Default. |
| **Sniper** | Fastest execution (~400ms). gRPC event-driven, skips AI eval, Jito bundles. Fire-and-forget. |
| **Spread Farmer** | Targets 10-45% bonding curve range with tight exits. Scalp-style. |
| **Whale Follower** | Copies detected whale wallet moves in real-time. |
| **Full Degen** | Aggressive trading with minimal filters. High risk, high reward. |
| **Custom** | Define your own strategy with a natural language prompt — powered by Claude AI. |

## Configuration

The setup wizard covers every option. You can also update any field live:

```bash
trenchfeed config --set maxPositionSol=1.0
trenchfeed config --set stopLossPct=15
trenchfeed config --set dryRun=false
trenchfeed config --set requireMintRevoked=true
```

### Identity

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `name` | string | TrenchAgent | Agent display name |
| `personality` | string | — | Agent personality prompt |
| `strategy` | string | ghost-filtered | Trading strategy |
| `executionMode` | string | default | Execution mode: `default`, `sniper`, or `careful` |
| `customStrategyPrompt` | string | — | Custom strategy prompt (for `custom` strategy) |

### Risk Management

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `maxPositionSol` | number | 0.5 | Max SOL per position |
| `maxTradeSizeSol` | number | 1 | Max SOL per single trade |
| `maxConcurrentPositions` | number | 3 | Max tokens to hold at once |
| `stopLossPct` | number | 20 | Sell if down this % |
| `takeProfitPct` | number | 50 | Sell if up this % |
| `dailyLossLimitSol` | number | 2 | Stop trading after losing this SOL |
| `dryRun` | boolean | true | `true` = paper trading, `false` = live SOL |

### Ghost V2 Insider Detection

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ghostEnabled` | boolean | true | Enable Ghost V2 insider wallet scanning |
| `minGhostScore` | number | 60 | Min score to buy (0-100, higher = pickier) |

### Automation

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `autoTrade` | boolean | true | Execute trades automatically |
| `confirmAboveSol` | number | — | Require confirmation above this SOL amount |
| `allowFollowers` | boolean | false | Allow copy-trading |
| `followerFeePercent` | number | 1 | Fee charged to followers on profits |

## Token Filters

Set any filter to control what tokens the agent will buy. Only tokens passing **all** set filters are eligible.

### Market & Liquidity

| Key | Type | Description |
|-----|------|-------------|
| `minMarketCap` | number | Min market cap in USD |
| `maxMarketCap` | number | Max market cap in USD |
| `minLiquidity` | number | Min liquidity in SOL |
| `maxLiquidity` | number | Max liquidity in SOL |

### Token Age & Holders

| Key | Type | Description |
|-----|------|-------------|
| `tokenAgeMinSeconds` | number | Min token age in seconds |
| `tokenAgeMaxSeconds` | number | Max token age in seconds |
| `minHolders` | number | Min holder count |
| `maxHolders` | number | Max holder count |

### Bonding Curve

| Key | Type | Description |
|-----|------|-------------|
| `minBondingProgress` | number | Min progress (0-1, e.g. `0.8` = 80%) |
| `maxBondingProgress` | number | Max progress (0-1) |
| `onlyGraduated` | boolean | Only buy tokens that graduated to Raydium/PumpSwap |
| `onlyBondingCurve` | boolean | Only buy tokens still on bonding curve |

### Transaction Activity

| Key | Type | Description |
|-----|------|-------------|
| `minBuyCount` | number | Min buy transactions |
| `maxBuyCount` | number | Max buy transactions |
| `minSellCount` | number | Min sell transactions |
| `maxSellCount` | number | Max sell transactions |
| `minTxCount` | number | Min total transactions |

### Volume & Price Momentum

| Key | Type | Description |
|-----|------|-------------|
| `minVolume24h` | number | Min 24h volume in USD |
| `maxVolume24h` | number | Max 24h volume in USD |
| `minPriceChange5m` | number | Min 5-minute price change % |
| `maxPriceChange5m` | number | Max 5-minute price change % |
| `minPriceChange1h` | number | Min 1-hour price change % |
| `maxPriceChange1h` | number | Max 1-hour price change % |

### Anti-Rug Filters

| Key | Type | Description |
|-----|------|-------------|
| `maxTopHolderPct` | number | Skip if top holders own above this % |
| `maxDevHoldingsPct` | number | Skip if dev holds above this % |
| `rejectDevBlacklisted` | boolean | Skip if dev wallet is blacklisted |
| `maxFreshWalletPct` | number | Skip if fresh wallets above this % of buys |
| `maxBundledBuysPct` | number | Skip if bundled/sniped buys above this % |

### DexScreener & Security

| Key | Type | Description |
|-----|------|-------------|
| `requireDexPaid` | boolean | Only buy tokens with paid DexScreener listing |
| `minDexBoosts` | number | Min DexScreener boosts |
| `requireMintRevoked` | boolean | Only buy if mint authority is revoked |
| `requireFreezeRevoked` | boolean | Only buy if freeze authority is revoked |
| `blacklistedMints` | string[] | Token addresses to never buy |

### Twitter Auto-Posting

| Key | Type | Description |
|-----|------|-------------|
| `twitter.enabled` | boolean | Enable Twitter posting |
| `twitter.events.buy` | boolean | Tweet on buy |
| `twitter.events.sell` | boolean | Tweet on sell |
| `twitter.events.dailySummary` | boolean | Post daily summary |
| `twitter.approvalRequired` | boolean | Require approval before posting |
| `twitter.autoPost` | boolean | Auto-post without manual trigger |
| `twitter.maxPostsPerDay` | number | Max tweets per day |
| `twitter.activeHoursStart` | number | Posting start hour (0-23) |
| `twitter.activeHoursEnd` | number | Posting end hour (0-24) |
| `twitter.weekendPosting` | boolean | Post on weekends |
| `twitter.dryRun` | boolean | Log tweets but don't post |

### Voice Narration

| Key | Type | Description |
|-----|------|-------------|
| `voice.enabled` | boolean | Enable voice narration |
| `voice.voice` | string | Voice ID (Ryan, Aiden, Cherry, Serena, Ethan, Jada, Kai) |
| `voice.instruct` | string | Voice instruction/tone |
| `voice.narrateAll` | boolean | Narrate all events (not just trades) |

---

## API Reference

Build your own integrations against the TrenchFeed API.

**Base URL**: `https://trenchfeed-api-production.up.railway.app`

### Authentication

```
Authorization: Bearer <api-key>
```

Get your API key via `trenchfeed setup` or `POST /api/cli/register`.

### Platform

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Server health + stats |
| `GET` | `/api/cli/config` | No | Platform config (burn gate info) |
| `GET` | `/api/config` | No | Full platform config |

### CLI Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/cli/register` | Yes | Register + create agent + get API key |
| `POST` | `/api/cli/token` | Yes | Generate new API key |

<details>
<summary>Register request body</summary>

```json
{
  "config": {
    "name": "MyAgent",
    "strategy": "ghost-filtered",
    "maxPositionSol": 0.5,
    "stopLossPct": 20,
    "takeProfitPct": 50
  },
  "burnTxSignature": "5KtP..."
}
```
</details>

### Agent Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/agents/me` | Yes | Get your agent |
| `GET` | `/api/agents/:id` | Yes | Agent detail + positions |
| `POST` | `/api/agents/:id/start` | Yes | Start trading |
| `POST` | `/api/agents/:id/stop` | Yes | Stop trading |
| `POST` | `/api/agents/:id/pause` | Yes | Pause trading |
| `POST` | `/api/agents/:id/resume` | Yes | Resume trading |
| `POST` | `/api/agents/:id/emergency` | Yes | Emergency stop + sell all |
| `PATCH` | `/api/agents/:id/config` | Yes | Update config (any field) |
| `DELETE` | `/api/agents/:id` | Yes | Delete agent |

<details>
<summary>Update config request body</summary>

```json
{
  "maxPositionSol": 1.0,
  "stopLossPct": 15,
  "dryRun": false,
  "requireMintRevoked": true
}
```
</details>

### Wallet

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/agents/:id/wallet` | Yes | Wallet address + balance |
| `POST` | `/api/agents/:id/wallet/withdraw` | Yes | Withdraw SOL |

<details>
<summary>Withdraw request body</summary>

```json
{
  "toAddress": "Abc123...",
  "amountSol": 0.5
}
```
</details>

### Trades & Public

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/agents/:id/trades?limit=50` | No | Trade history |
| `GET` | `/api/agents/public` | No | All public agents |
| `GET` | `/api/agents/public/:id` | No | Public agent detail |
| `GET` | `/api/leaderboard` | No | Agent leaderboard |
| `GET` | `/api/agents/:id/stats` | No | Agent stats (PnL, win rate, ROI) |

### Tips

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/agents/:id/tip` | Yes | Send tip to agent |
| `GET` | `/api/agents/:id/tips` | No | Tip history |
| `GET` | `/api/agents/:id/tips/leaderboard` | No | Tip leaderboard |
| `GET` | `/api/agents/:id/tips/total` | No | Total tips received |

## WebSocket

Connect to real-time agent event streams.

```
wss://trenchfeed-api-production.up.railway.app/ws/agents/:agentId
```

### Events

| Event | Fields | Description |
|-------|--------|-------------|
| `thought` | `text` | Agent's reasoning and analysis |
| `trade` | `action`, `mint`, `symbol`, `amountSol`, `price` | Buy/sell executed |
| `pnl_update` | `openPnlSol`, `closedPnlSol`, `positions[]` | Live PnL + positions |
| `status_change` | `oldStatus`, `newStatus` | Agent status changed |
| `error` | `message` | Error occurred |
| `chat_response` | `text` | Response to chat message |

### Send Chat

```json
{ "type": "chat", "text": "What tokens are you watching?" }
```

### Terminal Feed

```
wss://trenchfeed-api-production.up.railway.app/ws/terminal
```

Live PumpFun token feed — new pairs, migrations, graduations, candle data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TrenchFeed Platform                         │
├─────────────┬──────────────┬──────────────┬────────────────────────┤
│   CLI Tool  │  Web Dashboard │   REST API  │     WebSocket        │
│  (this pkg) │ (trenchfeed.fun) │            │   /ws/agents/:id   │
└──────┬──────┴──────┬───────┴──────┬───────┴────────┬───────────────┘
       │             │              │                │
       └─────────────┴──────┬───────┴────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │      Agent Manager        │
              │  create / start / stop    │
              │  config hot-reload        │
              └─────────────┬─────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
│ Trading Engine  │ │ Ghost V2    │ │ Token Scanner   │
│ tick loop (5s)  │ │ insider     │ │ PumpFun WS +    │
│ buy/sell/manage │ │ detection   │ │ DexScreener     │
└────────┬────────┘ └─────────────┘ └─────────────────┘
         │
    ┌────┴─────┐
    │ PumpFun  │  Sniper Engine  │  Raydium  │  Meteora
    │ SDK      │  (gRPC+Jito,    │  (graduated│  (DLMM)
    │ (bonding │   <50ms)        │   tokens)  │
    │  curve)  │                 │            │
    └──────────┘
```

## Requirements

- **Node.js** 20+
- **Solana wallet** for authentication
- **SOL** in agent wallet for live trading (paper trading requires no funds)

## License

[MIT](LICENSE)

---

<p align="center">
  <sub>Built by <a href="https://github.com/TrenchFeedbot">TrenchFeed</a> &middot; Powered by Claude AI &middot; Trading on Solana</sub>
</p>
