export const BANK_ID = "bancolombia";
export const CONFIG_FILENAME = ".bancolombia-config.json";
export const API_PORT = 3200;
export const DEFAULT_CURRENCY = "COP";

// Bancolombia direct API
export const LOGIN_URL = "https://svpersonas.apps.bancolombia.com/autenticacion";
export const BANCOLOMBIA_BASE_URL =
  "https://canalpersonas-ext.apps.bancolombia.com/super-svp/api/v1/security-filters";
export const ACCOUNTS_PATH =
  "/ch-ms-deposits/hybrid/accounts/customization/consolidated-balance";
export const TRANSACTIONS_PATH =
  "/ch-ms-deposits/account/transactions";

// Proxy API (fallback)
export const PROXY_API_URL = "http://localhost:3001";

export const SESSION_TTL_MS = 6 * 60 * 1000;
