/**
 * CLI API Client — REST client for TrenchFeed backend
 */
export declare const api: {
    health: () => Promise<{
        status: string;
        agents: number;
        running: number;
    }>;
    getCliConfig: () => Promise<{
        burnRequired: boolean;
        burnMint: string | null;
        burnAmount: number;
        burnTokenSymbol: string;
    }>;
    register: (walletToken: string, body: {
        config?: Record<string, unknown>;
        burnTxSignature?: string;
    }) => Promise<{
        apiKey: string;
        agentId: string;
        wallet: string;
        status: string;
        message: string;
    }>;
    getMyAgent: () => Promise<{
        id: string;
        userId: string;
        status: string;
        strategy: string;
        name: string;
        positions: number;
        openPnlSol: number;
        closedPnlSol: number;
        totalTrades: number;
        wallet: {
            publicKey: string;
        };
        createdAt: number;
        startedAt: number | null;
        dryRun?: boolean;
    }[]>;
    getAgent: (id: string) => Promise<{
        id: string;
        userId: string;
        status: string;
        config: Record<string, unknown>;
        openPnlSol: number;
        closedPnlSol: number;
        totalTrades: number;
        wallet: {
            publicKey: string;
        };
        positions: Array<{
            mint: string;
            symbol?: string;
            amountSol: number;
            entryPrice: number;
            currentPrice?: number;
            unrealizedPnl?: number;
            unrealizedPnlPct?: number;
        }>;
        createdAt: number;
        startedAt: number | null;
        stoppedAt: number | null;
    }>;
    startAgent: (id: string) => Promise<{
        status: string;
    }>;
    stopAgent: (id: string) => Promise<{
        status: string;
    }>;
    pauseAgent: (id: string) => Promise<{
        status: string;
    }>;
    resumeAgent: (id: string) => Promise<{
        status: string;
    }>;
    emergencyStop: (id: string) => Promise<{
        status: string;
    }>;
    updateConfig: (id: string, config: Record<string, unknown>) => Promise<{
        config: Record<string, unknown>;
    }>;
    getWallet: (id: string) => Promise<{
        publicKey: string;
        balance: number;
        lamports: number;
    }>;
    getTrades: (id: string, limit?: number) => Promise<{
        id: number;
        action: string;
        mint: string;
        symbol: string | null;
        amountSol: number | null;
        price: number | null;
        pnlSol: number | null;
        pnlPct: number | null;
        reason: string | null;
        createdAt: number;
    }[]>;
    withdraw: (id: string, toAddress: string, amountSol: number) => Promise<{
        signature: string;
    }>;
};
