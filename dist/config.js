"use strict";
/**
 * CLI Config — Stores API key and settings in ~/.trenchfeed/cli.json
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.clearConfig = clearConfig;
exports.getConfigPath = getConfigPath;
const path_1 = require("path");
const os_1 = require("os");
const fs_1 = require("fs");
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), '.trenchfeed');
const CONFIG_FILE = (0, path_1.join)(CONFIG_DIR, 'cli.json');
const DEFAULTS = {
    apiUrl: 'https://trenchfeed-production.up.railway.app',
    apiKey: null,
    agentId: null,
    wallet: null,
};
function loadConfig() {
    if (!(0, fs_1.existsSync)(CONFIG_FILE))
        return { ...DEFAULTS };
    try {
        const raw = (0, fs_1.readFileSync)(CONFIG_FILE, 'utf-8');
        return { ...DEFAULTS, ...JSON.parse(raw) };
    }
    catch {
        return { ...DEFAULTS };
    }
}
function saveConfig(config) {
    if (!(0, fs_1.existsSync)(CONFIG_DIR)) {
        (0, fs_1.mkdirSync)(CONFIG_DIR, { recursive: true });
    }
    const current = loadConfig();
    const merged = { ...current, ...config };
    (0, fs_1.writeFileSync)(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
}
function clearConfig() {
    if ((0, fs_1.existsSync)(CONFIG_FILE)) {
        (0, fs_1.writeFileSync)(CONFIG_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf-8');
    }
}
function getConfigPath() {
    return CONFIG_FILE;
}
//# sourceMappingURL=config.js.map