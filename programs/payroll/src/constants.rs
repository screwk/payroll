// ============================================================================
// PAYROLL - Constants & Security Configuration
// ============================================================================

use anchor_lang::prelude::*;

// ============================================================================
// TICKET & RAFFLE LIMITS
// ============================================================================

/// Maximum tickets a single wallet can buy per raffle
pub const MAX_TICKETS_PER_WALLET: u32 = 100;

/// Maximum total tickets per raffle
pub const MAX_TICKETS_PER_RAFFLE: u32 = 10_000;

/// Minimum raffle duration (1 hour in seconds)
pub const MIN_RAFFLE_DURATION: i64 = 3600;

/// Maximum raffle duration (30 days in seconds)
pub const MAX_RAFFLE_DURATION: i64 = 2_592_000;

// ============================================================================
// FINANCIAL LIMITS (in lamports - 1 SOL = 1_000_000_000)
// ============================================================================

/// Maximum prize amount (1000 SOL)
pub const MAX_PRIZE_AMOUNT: u64 = 1_000_000_000_000;

/// Minimum prize amount (0.1 SOL)
pub const MIN_PRIZE_AMOUNT: u64 = 100_000_000;

/// Minimum ticket price (0.001 SOL)
pub const MIN_TICKET_PRICE: u64 = 1_000_000;

/// Maximum ticket price (10 SOL)
pub const MAX_TICKET_PRICE: u64 = 10_000_000_000;

/// Platform fee in basis points (3% = 300 bps)
pub const PLATFORM_FEE_BPS: u16 = 300;

/// Maximum platform fee (10% = 1000 bps)
pub const MAX_PLATFORM_FEE_BPS: u16 = 1000;

/// Basis points denominator
pub const BPS_DENOMINATOR: u16 = 10_000;

// ============================================================================
// RATE LIMITING
// ============================================================================

/// Minimum seconds between ticket purchases per wallet
pub const RATE_LIMIT_SECONDS: i64 = 30;

/// Minimum seconds between raffle creations by admin
pub const ADMIN_RATE_LIMIT_SECONDS: i64 = 60;

// ============================================================================
// ADMIN SECURITY
// ============================================================================

/// Timelock duration for admin transfer (24 hours)
pub const ADMIN_TIMELOCK_SECONDS: i64 = 86_400;

/// Timelock for emergency actions (1 hour)
pub const EMERGENCY_TIMELOCK_SECONDS: i64 = 3_600;

/// Minimum block confirmations for randomness
pub const MIN_BLOCK_CONFIRMATIONS: u64 = 32;

// ============================================================================
// VRF CONFIGURATION
// ============================================================================

/// VRF request timeout (5 minutes)
pub const VRF_TIMEOUT_SECONDS: i64 = 300;

/// VRF callback gas limit
pub const VRF_CALLBACK_GAS: u64 = 100_000;

// ============================================================================
// SEEDS FOR PDAs
// ============================================================================

pub const PLATFORM_SEED: &[u8] = b"platform";
pub const RAFFLE_SEED: &[u8] = b"raffle";
pub const RAFFLE_VAULT_SEED: &[u8] = b"raffle_vault";
pub const TICKET_SEED: &[u8] = b"ticket";
pub const USER_STATS_SEED: &[u8] = b"user_stats";
pub const BLACKLIST_SEED: &[u8] = b"blacklist";
pub const SECURITY_CONFIG_SEED: &[u8] = b"security";

// ============================================================================
// ACCOUNT SIZES (for rent calculation)
// ============================================================================

/// Extra space for future upgrades
pub const ACCOUNT_RESERVE_SPACE: usize = 64;
