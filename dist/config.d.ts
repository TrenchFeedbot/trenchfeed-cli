/**
 * CLI Config — Stores API key and settings in ~/.trenchfeed/cli.json
 */
export interface CliConfig {
    apiUrl: string;
    apiKey: string | null;
    agentId: string | null;
    wallet: string | null;
}
export declare function loadConfig(): CliConfig;
export declare function saveConfig(config: Partial<CliConfig>): void;
export declare function clearConfig(): void;
export declare function getConfigPath(): string;
