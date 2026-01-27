// PAYROLL Configuration

// Admin wallet addresses
const ENV_ADMINS = (process.env.NEXT_PUBLIC_ADMIN_WALLET || process.env.ADMIN_WALLET || "2qzHXnRAv4zUTQkozqFfCAFjgMd4ngTkGEcu2LprDweC").split(',');
export const ADMIN_WALLETS = [
    ...ENV_ADMINS.map(a => a.trim()),
    "F8TaQKeVkmnu5kma1adHnougLyuJEbTjptkstfTcNsPw"
].filter((wallet, index, self) => wallet && self.indexOf(wallet) === index); // Deduplicate

export const ADMIN_WALLET = ADMIN_WALLETS[0]; // Primary admin for backwards compatibility

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta";
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://api.${NETWORK}.solana.com`;

// Check if we're on mainnet
export const IS_MAINNET = NETWORK === "mainnet-beta";

// Program ID (update after deploy)
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || "PayRo11111111111111111111111111111111111111";

// Fee configuration
export const PLATFORM_FEE_BPS = 300; // 3% platform fee

// Raffle limits
export const MIN_TICKET_PRICE = 0.001; // 0.001 SOL minimum
export const MAX_TICKET_PRICE = 100; // 100 SOL maximum
export const MIN_PRIZE_AMOUNT = 0.01; // 0.01 SOL minimum
export const MAX_PRIZE_AMOUNT = 10000; // 10,000 SOL maximum
export const MIN_TICKETS = 2;
export const MAX_TICKETS = 10000;
export const MIN_DURATION_HOURS = 1;
export const MAX_DURATION_HOURS = 168; // 7 days

// Free raffle limits - max tickets per wallet for free raffles
export const FREE_RAFFLE_MAX_TICKETS_PER_WALLET = 1; // Each wallet can only get 1 free ticket
