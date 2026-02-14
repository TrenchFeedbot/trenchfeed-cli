#!/usr/bin/env node
"use strict";
/**
 * TrenchFeed CLI — Deploy and manage AI trading agents from your terminal.
 *
 * Commands:
 *   trenchfeed setup       — Interactive agent setup wizard
 *   trenchfeed status      — Show agent status + PnL
 *   trenchfeed start       — Start trading
 *   trenchfeed stop        — Stop trading
 *   trenchfeed pause       — Pause trading
 *   trenchfeed resume      — Resume trading
 *   trenchfeed emergency   — Emergency stop + sell all
 *   trenchfeed config      — View/update agent config
 *   trenchfeed wallet      — Show wallet address + balance
 *   trenchfeed trades      — Show recent trade history
 *   trenchfeed stream      — Live stream agent events
 *   trenchfeed chat <msg>  — Send a message to your agent
 *   trenchfeed login       — Reconnect with existing API key
 *   trenchfeed logout      — Clear stored credentials
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const ws_1 = require("ws");
const config_1 = require("./config");
const api_1 = require("./api");
const program = new commander_1.Command();
// ─── Helpers ──────────────────────────────────────────────────────────────────
function banner() {
    console.log(chalk_1.default.red(figlet_1.default.textSync('TRENCHFEED', { font: 'Small' })));
    console.log(chalk_1.default.gray('  AI Trading Agent Platform — CLI\n'));
}
function requireSetup() {
    const config = (0, config_1.loadConfig)();
    if (!config.apiKey || !config.agentId) {
        console.log(chalk_1.default.yellow('No agent configured. Run `trenchfeed setup` first.'));
        process.exit(1);
    }
    return { apiKey: config.apiKey, agentId: config.agentId };
}
function formatSol(n) {
    const sign = n >= 0 ? '+' : '';
    const color = n >= 0 ? chalk_1.default.green : chalk_1.default.red;
    return color(`${sign}${n.toFixed(4)} SOL`);
}
function formatPct(n) {
    const sign = n >= 0 ? '+' : '';
    const color = n >= 0 ? chalk_1.default.green : chalk_1.default.red;
    return color(`${sign}${n.toFixed(1)}%`);
}
function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)
        return `${s}s ago`;
    if (s < 3600)
        return `${Math.floor(s / 60)}m ago`;
    if (s < 86400)
        return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}
function statusColor(status) {
    switch (status) {
        case 'running': return chalk_1.default.green(status);
        case 'paused': return chalk_1.default.yellow(status);
        case 'stopped': return chalk_1.default.gray(status);
        case 'error': return chalk_1.default.red(status);
        default: return status;
    }
}
// ─── Setup Command ────────────────────────────────────────────────────────────
program
    .command('setup')
    .description('Interactive agent setup wizard')
    .action(async () => {
    banner();
    console.log(chalk_1.default.white('Agent Setup Wizard\n'));
    const config = (0, config_1.loadConfig)();
    // Check if already set up
    if (config.apiKey && config.agentId) {
        const { overwrite } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: `Agent ${chalk_1.default.cyan(config.agentId)} already configured. Set up a new one?`,
                default: false,
            }]);
        if (!overwrite) {
            console.log(chalk_1.default.gray('Keeping existing configuration.'));
            return;
        }
    }
    // Step 1: Check server
    process.stdout.write(chalk_1.default.gray('  Connecting to TrenchFeed... '));
    try {
        const health = await api_1.api.health();
        console.log(chalk_1.default.green('OK') + chalk_1.default.gray(` (${health.agents ?? 0} agents online)`));
    }
    catch {
        console.log(chalk_1.default.red('FAILED'));
        console.log(chalk_1.default.red('  Could not reach TrenchFeed servers.'));
        console.log(chalk_1.default.gray('  Check your internet connection and try again.'));
        return;
    }
    // Step 2: Check burn gate
    let burnRequired = false;
    let burnMint = '';
    let burnAmount = 0;
    let burnSymbol = '$TRENCH';
    try {
        const platformConfig = await api_1.api.getCliConfig();
        burnRequired = platformConfig.burnRequired;
        burnMint = platformConfig.burnMint ?? '';
        burnAmount = platformConfig.burnAmount;
        burnSymbol = platformConfig.burnTokenSymbol ?? '$TRENCH';
    }
    catch {
        // If config endpoint unavailable, continue without burn gate info
    }
    if (burnRequired) {
        console.log();
        console.log(chalk_1.default.yellow(`  ⚠ Token burn required: ${burnAmount.toLocaleString()} ${burnSymbol}`));
        console.log(chalk_1.default.gray(`  Burn mint: ${burnMint}`));
        console.log(chalk_1.default.gray(`  Burn your tokens first, then paste the TX signature when prompted.`));
    }
    // Step 3: Wallet address
    console.log();
    const { walletAddress } = await inquirer_1.default.prompt([{
            type: 'input',
            name: 'walletAddress',
            message: 'Your Solana wallet address:',
            validate: (v) => /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(v) || 'Invalid Solana address',
        }]);
    // Burn TX if required
    let burnTxSignature;
    if (burnRequired) {
        const { burnTx } = await inquirer_1.default.prompt([{
                type: 'input',
                name: 'burnTx',
                message: `Burn TX signature (${burnAmount.toLocaleString()} ${burnSymbol}):`,
                validate: (v) => v.length >= 64 || 'Invalid transaction signature',
            }]);
        burnTxSignature = burnTx;
    }
    // Step 4: Agent configuration
    console.log(chalk_1.default.white('\n─── Agent Identity ───\n'));
    const { name } = await inquirer_1.default.prompt([{
            type: 'input',
            name: 'name',
            message: 'Agent name:',
            default: 'TrenchAgent',
        }]);
    const { personality } = await inquirer_1.default.prompt([{
            type: 'input',
            name: 'personality',
            message: 'Agent personality:',
            default: 'Sharp, data-driven Solana memecoin trader. Concise analysis, no fluff.',
        }]);
    const { strategy } = await inquirer_1.default.prompt([{
            type: 'list',
            name: 'strategy',
            message: 'Trading strategy:',
            choices: [
                { name: 'Ghost Filtered — Ghost V2 insider detection, highest safety (recommended)', value: 'ghost-filtered' },
                { name: 'Sniper — Fastest execution (~400ms), skips AI eval', value: 'sniper' },
                { name: 'Spread Farmer — 10-45% bonding curve, tight exits', value: 'spread-farmer' },
                { name: 'Whale Follower — Copy detected whale wallets', value: 'whale-follower' },
                { name: 'Full Degen — Aggressive, minimal filters', value: 'full-degen' },
                { name: 'Custom — Define your own strategy with natural language', value: 'custom' },
            ],
        }]);
    let customStrategyPrompt;
    if (strategy === 'custom') {
        const { prompt } = await inquirer_1.default.prompt([{
                type: 'editor',
                name: 'prompt',
                message: 'Custom strategy prompt (opens editor):',
            }]);
        customStrategyPrompt = prompt;
    }
    // ─── Trading Mode ──────────────────────────────────────────────
    console.log(chalk_1.default.white('\n─── Trading Mode ───\n'));
    let dryRun = true;
    const { dryRunChoice } = await inquirer_1.default.prompt([{
            type: 'list',
            name: 'dryRunChoice',
            message: 'Trading mode:',
            choices: [
                { name: chalk_1.default.green('Paper Trading') + chalk_1.default.gray(' — Simulated, no real SOL at risk'), value: true },
                { name: chalk_1.default.red('Live Trading') + chalk_1.default.gray(' — Real SOL, real trades on-chain'), value: false },
            ],
        }]);
    dryRun = dryRunChoice;
    if (!dryRun) {
        const { confirm } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: chalk_1.default.red('WARNING: Live trading uses REAL SOL. Losses are permanent. Continue?'),
                default: false,
            }]);
        if (!confirm) {
            dryRun = true;
            console.log(chalk_1.default.gray('Switched to paper trading.'));
        }
    }
    // ─── Execution Mode ────────────────────────────────────────────
    let executionMode = 'default';
    if (strategy === 'sniper') {
        executionMode = 'sniper';
        console.log(chalk_1.default.gray('\n  Execution: Sniper mode (auto-set for sniper strategy)'));
    }
    else {
        console.log(chalk_1.default.white('\n─── Execution Speed ───\n'));
        const { execChoice } = await inquirer_1.default.prompt([{
                type: 'list',
                name: 'execChoice',
                message: 'Execution mode:',
                choices: [
                    { name: chalk_1.default.white('Default') + chalk_1.default.gray(' — Balanced. Ghost scoring + heuristic filters'), value: 'default' },
                    { name: chalk_1.default.cyan('Sniper') + chalk_1.default.gray(' — Fastest (~400ms). Skips AI eval, fire-and-forget'), value: 'sniper' },
                    { name: chalk_1.default.yellow('Careful') + chalk_1.default.gray(' — Full pipeline. Claude AI eval on every trade'), value: 'careful' },
                ],
            }]);
        executionMode = execChoice;
    }
    // ─── Risk Management ───────────────────────────────────────────
    console.log(chalk_1.default.white('\n─── Risk Management ───\n'));
    const riskAnswers = await inquirer_1.default.prompt([
        { type: 'number', name: 'maxPositionSol', message: 'Max SOL per position:', default: 0.5 },
        { type: 'number', name: 'maxTradeSizeSol', message: 'Max SOL per single trade:', default: 1 },
        { type: 'number', name: 'maxConcurrentPositions', message: 'Max concurrent positions:', default: 3 },
        { type: 'number', name: 'stopLossPct', message: 'Stop loss % (e.g. 20 = sell if down 20%):', default: 20 },
        { type: 'number', name: 'takeProfitPct', message: 'Take profit % (e.g. 50 = sell if up 50%):', default: 50 },
        { type: 'number', name: 'dailyLossLimitSol', message: 'Daily loss limit SOL (stop trading after):', default: 2 },
    ]);
    // ─── Ghost Insider Detection ───────────────────────────────────
    console.log(chalk_1.default.white('\n─── Ghost V2 Insider Detection ───\n'));
    const ghostAnswers = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'ghostEnabled',
            message: 'Enable Ghost V2 insider wallet scanning?',
            default: true,
        },
        {
            type: 'number',
            name: 'minGhostScore',
            message: 'Min Ghost score to buy (0-100, higher = pickier):',
            default: 60,
            when: (a) => a.ghostEnabled === true,
        },
    ]);
    // ─── Automation ────────────────────────────────────────────────
    console.log(chalk_1.default.white('\n─── Automation ───\n'));
    const autoAnswers = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'autoTrade',
            message: 'Auto-trade (execute trades automatically)?',
            default: true,
        },
        {
            type: 'number',
            name: 'confirmAboveSol',
            message: 'Require confirmation above SOL amount (0 = never):',
            default: 0,
        },
    ]);
    if (autoAnswers.confirmAboveSol === 0)
        delete autoAnswers.confirmAboveSol;
    // ─── Copy Trading ──────────────────────────────────────────────
    const copyAnswers = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'allowFollowers',
            message: 'Allow others to copy-trade your agent?',
            default: false,
        },
        {
            type: 'number',
            name: 'followerFeePercent',
            message: 'Follower fee % (charged on profits):',
            default: 1,
            when: (a) => a.allowFollowers === true,
        },
    ]);
    // ─── Token Filters (opt-in sections) ───────────────────────────
    console.log(chalk_1.default.white('\n─── Token Filters ───'));
    console.log(chalk_1.default.gray('  Configure which tokens the agent can buy.'));
    console.log(chalk_1.default.gray('  Leave blank/0 to skip any filter.\n'));
    const { configureSections } = await inquirer_1.default.prompt([{
            type: 'checkbox',
            name: 'configureSections',
            message: 'Which filter sections do you want to configure?',
            choices: [
                { name: 'Market Cap & Liquidity', value: 'market' },
                { name: 'Token Age & Holders', value: 'age' },
                { name: 'Bonding Curve / Graduation', value: 'bonding' },
                { name: 'Transaction Activity', value: 'activity' },
                { name: 'Volume & Price Momentum', value: 'momentum' },
                { name: 'Anti-Rug (holder concentration, fresh wallets)', value: 'antirug' },
                { name: 'DexScreener & Security', value: 'security' },
                { name: 'Blacklisted Mints', value: 'blacklist' },
            ],
        }]);
    const sections = new Set(configureSections);
    const filters = {};
    // Helper: prompt for optional number, return undefined if 0/empty
    const optNum = (answers, key) => {
        const v = answers[key];
        if (v != null && v !== 0)
            filters[key] = v;
    };
    if (sections.has('market')) {
        console.log(chalk_1.default.gray('\n  Market Cap & Liquidity'));
        const a = await inquirer_1.default.prompt([
            { type: 'number', name: 'minMarketCap', message: 'Min market cap USD (0=skip):', default: 0 },
            { type: 'number', name: 'maxMarketCap', message: 'Max market cap USD (0=skip):', default: 0 },
            { type: 'number', name: 'minLiquidity', message: 'Min liquidity SOL (0=skip):', default: 0 },
            { type: 'number', name: 'maxLiquidity', message: 'Max liquidity SOL (0=skip):', default: 0 },
        ]);
        optNum(a, 'minMarketCap');
        optNum(a, 'maxMarketCap');
        optNum(a, 'minLiquidity');
        optNum(a, 'maxLiquidity');
    }
    if (sections.has('age')) {
        console.log(chalk_1.default.gray('\n  Token Age & Holders'));
        const a = await inquirer_1.default.prompt([
            { type: 'number', name: 'tokenAgeMinSeconds', message: 'Min token age seconds (0=skip):', default: 0 },
            { type: 'number', name: 'tokenAgeMaxSeconds', message: 'Max token age seconds (0=skip):', default: 0 },
            { type: 'number', name: 'minHolders', message: 'Min holders (0=skip):', default: 0 },
            { type: 'number', name: 'maxHolders', message: 'Max holders (0=skip):', default: 0 },
        ]);
        optNum(a, 'tokenAgeMinSeconds');
        optNum(a, 'tokenAgeMaxSeconds');
        optNum(a, 'minHolders');
        optNum(a, 'maxHolders');
    }
    if (sections.has('bonding')) {
        console.log(chalk_1.default.gray('\n  Bonding Curve / Graduation'));
        const a = await inquirer_1.default.prompt([
            { type: 'number', name: 'minBondingProgress', message: 'Min bonding progress (0-1, e.g. 0.8 = 80%):', default: 0 },
            { type: 'number', name: 'maxBondingProgress', message: 'Max bonding progress (0-1, 0=skip):', default: 0 },
            { type: 'confirm', name: 'onlyGraduated', message: 'Only buy graduated tokens?', default: false },
            { type: 'confirm', name: 'onlyBondingCurve', message: 'Only buy bonding curve tokens?', default: false },
        ]);
        optNum(a, 'minBondingProgress');
        optNum(a, 'maxBondingProgress');
        if (a.onlyGraduated)
            filters.onlyGraduated = true;
        if (a.onlyBondingCurve)
            filters.onlyBondingCurve = true;
    }
    if (sections.has('activity')) {
        console.log(chalk_1.default.gray('\n  Transaction Activity'));
        const a = await inquirer_1.default.prompt([
            { type: 'number', name: 'minBuyCount', message: 'Min buy transactions (0=skip):', default: 0 },
            { type: 'number', name: 'maxBuyCount', message: 'Max buy transactions (0=skip):', default: 0 },
            { type: 'number', name: 'minSellCount', message: 'Min sell transactions (0=skip):', default: 0 },
            { type: 'number', name: 'maxSellCount', message: 'Max sell transactions (0=skip):', default: 0 },
            { type: 'number', name: 'minTxCount', message: 'Min total transactions (0=skip):', default: 0 },
        ]);
        optNum(a, 'minBuyCount');
        optNum(a, 'maxBuyCount');
        optNum(a, 'minSellCount');
        optNum(a, 'maxSellCount');
        optNum(a, 'minTxCount');
    }
    if (sections.has('momentum')) {
        console.log(chalk_1.default.gray('\n  Volume & Price Momentum'));
        const a = await inquirer_1.default.prompt([
            { type: 'number', name: 'minVolume24h', message: 'Min 24h volume USD (0=skip):', default: 0 },
            { type: 'number', name: 'maxVolume24h', message: 'Max 24h volume USD (0=skip):', default: 0 },
            { type: 'number', name: 'minPriceChange5m', message: 'Min 5m price change % (0=skip):', default: 0 },
            { type: 'number', name: 'maxPriceChange5m', message: 'Max 5m price change % (0=skip):', default: 0 },
            { type: 'number', name: 'minPriceChange1h', message: 'Min 1h price change % (0=skip):', default: 0 },
            { type: 'number', name: 'maxPriceChange1h', message: 'Max 1h price change % (0=skip):', default: 0 },
        ]);
        optNum(a, 'minVolume24h');
        optNum(a, 'maxVolume24h');
        optNum(a, 'minPriceChange5m');
        optNum(a, 'maxPriceChange5m');
        optNum(a, 'minPriceChange1h');
        optNum(a, 'maxPriceChange1h');
    }
    if (sections.has('antirug')) {
        console.log(chalk_1.default.gray('\n  Anti-Rug Filters'));
        const a = await inquirer_1.default.prompt([
            { type: 'number', name: 'maxTopHolderPct', message: 'Max top holder % (0=skip, e.g. 30):', default: 0 },
            { type: 'number', name: 'maxDevHoldingsPct', message: 'Max dev holdings % (0=skip, e.g. 20):', default: 0 },
            { type: 'confirm', name: 'rejectDevBlacklisted', message: 'Reject blacklisted devs?', default: false },
            { type: 'number', name: 'maxFreshWalletPct', message: 'Max fresh wallet % of buys (0=skip):', default: 0 },
            { type: 'number', name: 'maxBundledBuysPct', message: 'Max bundled/sniped buys % (0=skip):', default: 0 },
        ]);
        optNum(a, 'maxTopHolderPct');
        optNum(a, 'maxDevHoldingsPct');
        if (a.rejectDevBlacklisted)
            filters.rejectDevBlacklisted = true;
        optNum(a, 'maxFreshWalletPct');
        optNum(a, 'maxBundledBuysPct');
    }
    if (sections.has('security')) {
        console.log(chalk_1.default.gray('\n  DexScreener & Security'));
        const a = await inquirer_1.default.prompt([
            { type: 'confirm', name: 'requireDexPaid', message: 'Require paid DexScreener listing?', default: false },
            { type: 'number', name: 'minDexBoosts', message: 'Min DexScreener boosts (0=skip):', default: 0 },
            { type: 'confirm', name: 'requireMintRevoked', message: 'Require mint authority revoked?', default: false },
            { type: 'confirm', name: 'requireFreezeRevoked', message: 'Require freeze authority revoked?', default: false },
        ]);
        if (a.requireDexPaid)
            filters.requireDexPaid = true;
        optNum(a, 'minDexBoosts');
        if (a.requireMintRevoked)
            filters.requireMintRevoked = true;
        if (a.requireFreezeRevoked)
            filters.requireFreezeRevoked = true;
    }
    if (sections.has('blacklist')) {
        console.log(chalk_1.default.gray('\n  Blacklisted Mints'));
        const { mints } = await inquirer_1.default.prompt([{
                type: 'input',
                name: 'mints',
                message: 'Blacklisted token addresses (comma-separated, or empty):',
                default: '',
            }]);
        const mintList = mints.split(',').map((m) => m.trim()).filter(Boolean);
        if (mintList.length > 0)
            filters.blacklistedMints = mintList;
    }
    // ─── Twitter Config (opt-in) ───────────────────────────────────
    console.log();
    const { configureTwitter } = await inquirer_1.default.prompt([{
            type: 'confirm',
            name: 'configureTwitter',
            message: 'Configure Twitter auto-posting?',
            default: false,
        }]);
    let twitter;
    if (configureTwitter) {
        console.log(chalk_1.default.white('\n─── Twitter Config ───\n'));
        const tw = await inquirer_1.default.prompt([
            { type: 'confirm', name: 'enabled', message: 'Enable Twitter posting?', default: true },
            { type: 'confirm', name: 'tweetOnBuy', message: 'Tweet on buy?', default: true },
            { type: 'confirm', name: 'tweetOnSell', message: 'Tweet on sell?', default: true },
            { type: 'confirm', name: 'dailySummary', message: 'Post daily summary?', default: false },
            { type: 'confirm', name: 'approvalRequired', message: 'Require approval before posting?', default: false },
            { type: 'confirm', name: 'autoPost', message: 'Auto-post tweets?', default: true },
            { type: 'number', name: 'maxPostsPerDay', message: 'Max posts per day:', default: 10 },
            { type: 'number', name: 'activeHoursStart', message: 'Active hours start (0-23):', default: 0 },
            { type: 'number', name: 'activeHoursEnd', message: 'Active hours end (0-24):', default: 24 },
            { type: 'confirm', name: 'weekendPosting', message: 'Post on weekends?', default: true },
            { type: 'confirm', name: 'twDryRun', message: 'Twitter dry run (log but don\'t post)?', default: true },
        ]);
        const { twSystemPrompt } = await inquirer_1.default.prompt([{
                type: 'input',
                name: 'twSystemPrompt',
                message: 'Twitter persona prompt:',
                default: 'You are a Solana memecoin trading agent. Be concise, data-first. Max 280 chars.',
            }]);
        twitter = {
            enabled: tw.enabled,
            events: {
                buy: tw.tweetOnBuy,
                sell: tw.tweetOnSell,
                dailySummary: tw.dailySummary,
            },
            persona: {
                systemPrompt: twSystemPrompt,
            },
            approvalRequired: tw.approvalRequired,
            autoPost: tw.autoPost,
            maxPostsPerDay: tw.maxPostsPerDay,
            activeHoursStart: tw.activeHoursStart,
            activeHoursEnd: tw.activeHoursEnd,
            weekendPosting: tw.weekendPosting,
            dryRun: tw.twDryRun,
        };
    }
    // ─── Voice Config (opt-in) ─────────────────────────────────────
    const { configureVoice } = await inquirer_1.default.prompt([{
            type: 'confirm',
            name: 'configureVoice',
            message: 'Configure voice narration?',
            default: false,
        }]);
    let voice;
    if (configureVoice) {
        console.log(chalk_1.default.white('\n─── Voice Config ───\n'));
        const v = await inquirer_1.default.prompt([
            { type: 'confirm', name: 'enabled', message: 'Enable voice narration?', default: true },
            {
                type: 'list', name: 'voice', message: 'Voice:', choices: [
                    { name: 'Ryan — English male, clear, confident', value: 'Ryan' },
                    { name: 'Aiden — English male, calm, analytical', value: 'Aiden' },
                    { name: 'Cherry — Female, bright, energetic', value: 'Cherry' },
                    { name: 'Serena — Female, warm, composed', value: 'Serena' },
                    { name: 'Ethan — Male, deep, authoritative', value: 'Ethan' },
                    { name: 'Jada — Female, smooth, professional', value: 'Jada' },
                    { name: 'Kai — Male, youthful, energetic', value: 'Kai' },
                ],
            },
            { type: 'input', name: 'instruct', message: 'Voice instruction:', default: 'Speak clearly with a confident, analytical tone' },
            { type: 'confirm', name: 'narrateAll', message: 'Narrate all events (not just trades)?', default: false },
        ]);
        voice = v;
    }
    // ─── Build final config ────────────────────────────────────────
    const agentConfig = {
        name,
        personality,
        strategy,
        executionMode,
        dryRun,
        ...riskAnswers,
        ...ghostAnswers,
        ...autoAnswers,
        ...copyAnswers,
        ...filters,
    };
    if (customStrategyPrompt)
        agentConfig.customStrategyPrompt = customStrategyPrompt;
    if (twitter)
        agentConfig.twitter = twitter;
    if (voice)
        agentConfig.voice = voice;
    // Step 6: Register
    console.log(chalk_1.default.gray('\nDeploying agent...'));
    try {
        const result = await api_1.api.register(walletAddress, {
            config: agentConfig,
            burnTxSignature,
        });
        (0, config_1.saveConfig)({
            apiKey: result.apiKey,
            agentId: result.agentId,
            wallet: result.wallet,
        });
        console.log(chalk_1.default.green('\nAgent deployed successfully!\n'));
        console.log(chalk_1.default.white(`  Agent ID:  ${chalk_1.default.cyan(result.agentId)}`));
        console.log(chalk_1.default.white(`  Wallet:    ${chalk_1.default.cyan(result.wallet)}`));
        console.log(chalk_1.default.white(`  Mode:      ${dryRun ? chalk_1.default.green('PAPER') : chalk_1.default.red('LIVE')}`));
        console.log(chalk_1.default.white(`  Execution: ${executionMode === 'sniper' ? chalk_1.default.cyan('SNIPER') : executionMode === 'careful' ? chalk_1.default.yellow('CAREFUL') : chalk_1.default.white('DEFAULT')}`));
        console.log(chalk_1.default.white(`  Strategy:  ${chalk_1.default.cyan(strategy)}`));
        console.log(chalk_1.default.gray(`\n  Config saved to ${(0, config_1.getConfigPath)()}`));
        console.log(chalk_1.default.gray('  API key stored securely.\n'));
        console.log(chalk_1.default.white('Next steps:'));
        console.log(chalk_1.default.gray('  trenchfeed start    — Start your agent'));
        console.log(chalk_1.default.gray('  trenchfeed status   — View agent status'));
        console.log(chalk_1.default.gray('  trenchfeed stream   — Watch live activity'));
        if (!dryRun) {
            console.log(chalk_1.default.yellow(`\n  Fund your wallet to start live trading:`));
            console.log(chalk_1.default.cyan(`  ${result.wallet}`));
        }
    }
    catch (err) {
        console.log(chalk_1.default.red(`\nSetup failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
});
// ─── Status Command ───────────────────────────────────────────────────────────
program
    .command('status')
    .description('Show agent status, PnL, and positions')
    .action(async () => {
    const { agentId } = requireSetup();
    try {
        const agent = await api_1.api.getAgent(agentId);
        const config = agent.config;
        console.log();
        console.log(chalk_1.default.white.bold(config.name ?? agentId));
        console.log(chalk_1.default.gray(`  ID: ${agentId}`));
        console.log(chalk_1.default.gray(`  Status: ${statusColor(agent.status)}`));
        console.log(chalk_1.default.gray(`  Strategy: ${config.strategy}`));
        console.log(chalk_1.default.gray(`  Mode: ${config.dryRun !== false ? chalk_1.default.green('PAPER') : chalk_1.default.red('LIVE')}`));
        console.log(chalk_1.default.gray(`  Wallet: ${agent.wallet.publicKey}`));
        console.log();
        console.log(chalk_1.default.white('  PnL'));
        console.log(`    Open:    ${formatSol(agent.openPnlSol)}`);
        console.log(`    Closed:  ${formatSol(agent.closedPnlSol)}`);
        console.log(`    Total:   ${formatSol(agent.openPnlSol + agent.closedPnlSol)}`);
        console.log(`    Trades:  ${chalk_1.default.white(agent.totalTrades.toString())}`);
        if (agent.positions && agent.positions.length > 0) {
            console.log();
            console.log(chalk_1.default.white(`  Positions (${agent.positions.length})`));
            for (const p of agent.positions) {
                const sym = p.symbol ?? p.mint.slice(0, 8);
                const pnl = p.unrealizedPnl != null ? formatSol(p.unrealizedPnl) : chalk_1.default.gray('—');
                const pnlPct = p.unrealizedPnlPct != null ? formatPct(p.unrealizedPnlPct) : '';
                console.log(`    ${chalk_1.default.cyan(sym.padEnd(12))} ${p.amountSol.toFixed(4)} SOL  ${pnl}  ${pnlPct}`);
            }
        }
        if (agent.startedAt) {
            console.log();
            console.log(chalk_1.default.gray(`  Started ${timeAgo(agent.startedAt)}`));
        }
        console.log();
    }
    catch (err) {
        console.log(chalk_1.default.red(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
});
// ─── Start / Stop / Pause / Resume / Emergency ───────────────────────────────
for (const [cmd, desc, fn] of [
    ['start', 'Start trading', (id) => api_1.api.startAgent(id)],
    ['stop', 'Stop trading', (id) => api_1.api.stopAgent(id)],
    ['pause', 'Pause trading', (id) => api_1.api.pauseAgent(id)],
    ['resume', 'Resume trading', (id) => api_1.api.resumeAgent(id)],
    ['emergency', 'Emergency stop + sell all positions', (id) => api_1.api.emergencyStop(id)],
]) {
    program
        .command(cmd)
        .description(desc)
        .action(async () => {
        const { agentId } = requireSetup();
        if (cmd === 'emergency') {
            const { confirm } = await inquirer_1.default.prompt([{
                    type: 'confirm',
                    name: 'confirm',
                    message: chalk_1.default.red('Emergency stop will sell ALL positions immediately. Continue?'),
                    default: false,
                }]);
            if (!confirm)
                return;
        }
        try {
            const result = await fn(agentId);
            console.log(chalk_1.default.green(`Agent ${cmd}: ${result.status}`));
        }
        catch (err) {
            console.log(chalk_1.default.red(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
    });
}
// ─── Config Command ───────────────────────────────────────────────────────────
program
    .command('config')
    .description('View or update agent config')
    .option('-s, --set <key=value>', 'Set a config value (e.g. --set maxPositionSol=1)')
    .action(async (opts) => {
    const { agentId } = requireSetup();
    if (opts.set) {
        const eq = opts.set.indexOf('=');
        if (eq === -1) {
            console.log(chalk_1.default.red('Usage: --set key=value'));
            return;
        }
        const key = opts.set.slice(0, eq);
        const value = opts.set.slice(eq + 1);
        let parsed = value;
        if (value === 'true')
            parsed = true;
        else if (value === 'false')
            parsed = false;
        else if (!isNaN(Number(value)) && value !== '')
            parsed = Number(value);
        try {
            await api_1.api.updateConfig(agentId, { [key]: parsed });
            console.log(chalk_1.default.green(`Updated ${key} = ${JSON.stringify(parsed)}`));
        }
        catch (err) {
            console.log(chalk_1.default.red(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
        return;
    }
    try {
        const agent = await api_1.api.getAgent(agentId);
        console.log();
        console.log(chalk_1.default.white.bold('Agent Config'));
        console.log();
        const cfg = agent.config;
        const entries = Object.entries(cfg).filter(([, v]) => v !== undefined && v !== null);
        const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
        for (const [k, v] of entries) {
            const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
            console.log(`  ${chalk_1.default.gray(k.padEnd(maxKeyLen + 2))}${chalk_1.default.white(val)}`);
        }
        console.log();
        console.log(chalk_1.default.gray(`  Update: trenchfeed config --set key=value`));
        console.log();
    }
    catch (err) {
        console.log(chalk_1.default.red(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
});
// ─── Wallet Command ───────────────────────────────────────────────────────────
program
    .command('wallet')
    .description('Show wallet address and balance')
    .option('-w, --withdraw <address>', 'Withdraw SOL to address')
    .option('-a, --amount <sol>', 'Amount of SOL to withdraw')
    .action(async (opts) => {
    const { agentId } = requireSetup();
    if (opts.withdraw) {
        const amount = Number(opts.amount);
        if (!amount || isNaN(amount) || amount <= 0) {
            console.log(chalk_1.default.red('Specify amount with --amount <sol>'));
            return;
        }
        const { confirm } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: `Withdraw ${amount} SOL to ${opts.withdraw}?`,
                default: false,
            }]);
        if (!confirm)
            return;
        try {
            const result = await api_1.api.withdraw(agentId, opts.withdraw, amount);
            console.log(chalk_1.default.green(`Withdrawn! TX: ${result.signature}`));
        }
        catch (err) {
            console.log(chalk_1.default.red(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
        return;
    }
    try {
        const wallet = await api_1.api.getWallet(agentId);
        console.log();
        console.log(chalk_1.default.white.bold('Agent Wallet'));
        console.log(`  Address:  ${chalk_1.default.cyan(wallet.publicKey)}`);
        console.log(`  Balance:  ${chalk_1.default.white(wallet.balance.toFixed(4))} SOL`);
        console.log(`  Lamports: ${chalk_1.default.gray(wallet.lamports.toLocaleString())}`);
        console.log();
    }
    catch (err) {
        console.log(chalk_1.default.red(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
});
// ─── Trades Command ───────────────────────────────────────────────────────────
program
    .command('trades')
    .description('Show recent trade history')
    .option('-n, --limit <number>', 'Number of trades to show', '20')
    .action(async (opts) => {
    const { agentId } = requireSetup();
    try {
        const trades = await api_1.api.getTrades(agentId, Number(opts.limit));
        if (trades.length === 0) {
            console.log(chalk_1.default.gray('\nNo trades yet.\n'));
            return;
        }
        console.log();
        console.log(chalk_1.default.white.bold(`Recent Trades (${trades.length})`));
        console.log();
        for (const t of trades) {
            const sym = (t.symbol ?? t.mint.slice(0, 8)).padEnd(10);
            const action = t.action === 'buy'
                ? chalk_1.default.green('BUY ')
                : chalk_1.default.red('SELL');
            const sol = t.amountSol != null ? `${t.amountSol.toFixed(4)} SOL` : '—';
            const pnl = t.pnlSol != null ? formatSol(t.pnlSol) : '';
            const time = chalk_1.default.gray(timeAgo(t.createdAt));
            console.log(`  ${action} ${chalk_1.default.cyan(sym)} ${sol.padEnd(14)} ${pnl.padEnd(20)} ${time}`);
            if (t.reason) {
                console.log(chalk_1.default.gray(`       ${t.reason}`));
            }
        }
        console.log();
    }
    catch (err) {
        console.log(chalk_1.default.red(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
});
// ─── Stream Command ───────────────────────────────────────────────────────────
program
    .command('stream')
    .description('Live stream agent events via WebSocket')
    .action(async () => {
    const { agentId } = requireSetup();
    const config = (0, config_1.loadConfig)();
    const wsUrl = config.apiUrl.replace(/^http/, 'ws');
    console.log(chalk_1.default.gray(`Connecting to ${wsUrl}/ws/agents/${agentId}...\n`));
    const ws = new ws_1.WebSocket(`${wsUrl}/ws/agents/${agentId}`);
    ws.on('open', () => {
        console.log(chalk_1.default.green('Connected. Streaming events...\n'));
    });
    ws.on('message', (data) => {
        try {
            const event = JSON.parse(data.toString());
            const type = event.type;
            switch (type) {
                case 'thought':
                    console.log(chalk_1.default.gray(`[thought] ${event.text}`));
                    break;
                case 'trade':
                    console.log(chalk_1.default.yellow(`[trade] ${event.action} ${event.symbol ?? event.mint} — ${event.amountSol} SOL`));
                    break;
                case 'pnl_update':
                    console.log(chalk_1.default.blue(`[pnl] open: ${formatSol(event.openPnlSol)} | closed: ${formatSol(event.closedPnlSol)} | positions: ${event.positions?.length ?? 0}`));
                    break;
                case 'status_change':
                    console.log(chalk_1.default.white(`[status] ${event.oldStatus} → ${statusColor(event.newStatus)}`));
                    break;
                case 'error':
                    console.log(chalk_1.default.red(`[error] ${event.message}`));
                    break;
                case 'chat_response':
                    console.log(chalk_1.default.magenta(`[chat] ${event.text}`));
                    break;
                default:
                    console.log(chalk_1.default.gray(`[${type}] ${JSON.stringify(event).slice(0, 120)}`));
            }
        }
        catch {
            // ignore malformed
        }
    });
    ws.on('close', () => {
        console.log(chalk_1.default.gray('\nDisconnected.'));
        process.exit(0);
    });
    ws.on('error', (err) => {
        console.log(chalk_1.default.red(`WebSocket error: ${err.message}`));
        process.exit(1);
    });
    process.on('SIGINT', () => {
        console.log(chalk_1.default.gray('\nClosing stream...'));
        ws.close();
    });
});
// ─── Chat Command ─────────────────────────────────────────────────────────────
program
    .command('chat <message>')
    .description('Send a message to your agent')
    .action(async (message) => {
    const { agentId } = requireSetup();
    const config = (0, config_1.loadConfig)();
    const wsUrl = config.apiUrl.replace(/^http/, 'ws');
    const ws = new ws_1.WebSocket(`${wsUrl}/ws/agents/${agentId}`);
    ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'chat', text: message }));
        console.log(chalk_1.default.gray(`> ${message}`));
    });
    ws.on('message', (data) => {
        try {
            const event = JSON.parse(data.toString());
            if (event.type === 'chat_response') {
                console.log(chalk_1.default.cyan(`\n${event.text}\n`));
                ws.close();
            }
        }
        catch {
            // ignore
        }
    });
    setTimeout(() => {
        console.log(chalk_1.default.gray('(timeout — no response)'));
        ws.close();
        process.exit(0);
    }, 30000);
    ws.on('close', () => process.exit(0));
    ws.on('error', (err) => {
        console.log(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    });
});
// ─── Login Command (reconnect with existing API key) ─────────────────────────
program
    .command('login')
    .description('Reconnect to an existing agent with your API key')
    .action(async () => {
    banner();
    const { key } = await inquirer_1.default.prompt([{
            type: 'password',
            name: 'key',
            message: 'API key:',
            mask: '*',
        }]);
    (0, config_1.saveConfig)({ apiKey: key });
    try {
        const agents = await api_1.api.getMyAgent();
        if (agents.length > 0) {
            (0, config_1.saveConfig)({ agentId: agents[0].id, wallet: agents[0].wallet.publicKey });
            console.log(chalk_1.default.green(`\nConnected to agent ${chalk_1.default.cyan(agents[0].name)} (${agents[0].id})`));
            console.log(chalk_1.default.gray(`  Wallet: ${agents[0].wallet.publicKey}`));
            console.log(chalk_1.default.gray(`  Status: ${statusColor(agents[0].status)}`));
        }
        else {
            console.log(chalk_1.default.yellow('No agents found for this API key.'));
            console.log(chalk_1.default.gray('Run `trenchfeed setup` to create a new agent.'));
        }
    }
    catch {
        console.log(chalk_1.default.red('Invalid API key.'));
        (0, config_1.clearConfig)();
    }
});
// ─── Logout Command ──────────────────────────────────────────────────────────
program
    .command('logout')
    .description('Clear stored credentials')
    .action(() => {
    (0, config_1.clearConfig)();
    console.log(chalk_1.default.gray('Credentials cleared.'));
});
// ─── Main ─────────────────────────────────────────────────────────────────────
program
    .name('trenchfeed')
    .description('TrenchFeed — AI Trading Agent CLI')
    .version('0.1.0');
program.parse(process.argv);
if (process.argv.length <= 2) {
    banner();
    program.help();
}
//# sourceMappingURL=index.js.map