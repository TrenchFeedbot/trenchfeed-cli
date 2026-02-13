"use strict";
/**
 * CLI API Client — REST client for TrenchFeed backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const config_1 = require("./config");
async function request(path, opts = {}) {
    const config = (0, config_1.loadConfig)();
    const url = `${config.apiUrl}${path}`;
    const token = opts.token ?? config.apiKey;
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `API error ${res.status}`);
    }
    return res.json();
}
exports.api = {
    health: () => request('/health'),
    // Platform config
    getCliConfig: () => request('/api/cli/config'),
    // CLI auth
    register: (walletToken, body) => request('/api/cli/register', { method: 'POST', body, token: walletToken }),
    // Agent
    getMyAgent: () => request('/api/agents/me'),
    getAgent: (id) => request(`/api/agents/${id}`),
    startAgent: (id) => request(`/api/agents/${id}/start`, { method: 'POST' }),
    stopAgent: (id) => request(`/api/agents/${id}/stop`, { method: 'POST' }),
    pauseAgent: (id) => request(`/api/agents/${id}/pause`, { method: 'POST' }),
    resumeAgent: (id) => request(`/api/agents/${id}/resume`, { method: 'POST' }),
    emergencyStop: (id) => request(`/api/agents/${id}/emergency`, { method: 'POST' }),
    updateConfig: (id, config) => request(`/api/agents/${id}/config`, { method: 'PATCH', body: config }),
    getWallet: (id) => request(`/api/agents/${id}/wallet`),
    getTrades: (id, limit = 20) => request(`/api/agents/${id}/trades?limit=${limit}`),
    withdraw: (id, toAddress, amountSol) => request(`/api/agents/${id}/wallet/withdraw`, {
        method: 'POST', body: { toAddress, amountSol },
    }),
};
//# sourceMappingURL=api.js.map