// ============================================================================
// PAYROLL - State Accounts
// ============================================================================

use anchor_lang::prelude::*;

// ============================================================================
// PLATFORM STATE
// ============================================================================

/// Global platform configuration and state
#[account]
#[derive(InitSpace)]
pub struct Platform {
    /// Primary admin with full control
    pub admin: Pubkey,
    
    /// Pending admin for 2-step transfer (None if no transfer in progress)
    pub pending_admin: Option<Pubkey>,
    
    /// Timestamp when admin transfer was initiated
    pub admin_transfer_initiated_at: i64,
    
    /// Total number of raffles created
    pub total_raffles: u64,
    
    /// Total fees collected by the platform (in lamports)
    pub total_fees_collected: u64,
    
    /// Total prizes paid out (in lamports)
    pub total_prizes_paid: u64,
    
    /// Whether the platform is paused (emergency stop)
    pub is_paused: bool,
    
    /// Timestamp of last pause (for audit trail)
    pub last_paused_at: i64,
    
    /// Who paused the platform last
    pub paused_by: Option<Pubkey>,
    
    /// Platform fee in basis points (e.g., 300 = 3%)
    pub fee_bps: u16,
    
    /// Number of wallets on blacklist
    pub blacklist_count: u32,
    
    /// Timestamp of last admin action (for rate limiting)
    pub last_admin_action_at: i64,
    
    /// PDA bump seed
    pub bump: u8,
}

// ============================================================================
// RAFFLE STATE
// ============================================================================

/// Individual raffle state
#[account]
#[derive(InitSpace)]
pub struct Raffle {
    /// Unique raffle identifier
    pub id: u64,
    
    /// Admin who created this raffle
    pub admin: Pubkey,
    
    /// Prize amount in lamports
    pub prize_amount: u64,
    
    /// Ticket price in lamports (0 for free raffles)
    pub ticket_price: u64,
    
    /// Maximum number of tickets available
    pub max_tickets: u32,
    
    /// Number of tickets sold
    pub tickets_sold: u32,
    
    /// Maximum tickets per wallet (0 = unlimited)
    pub max_tickets_per_wallet: u32,
    
    /// Unix timestamp when raffle ends
    pub end_time: i64,
    
    /// Whether this is a free entry raffle
    pub is_free: bool,
    
    /// Whether the winner has been drawn
    pub is_drawn: bool,
    
    /// SECURITY: Reentrancy guard for claim operations
    pub is_claiming: bool,
    
    /// Whether the raffle is paused
    pub is_paused: bool,
    
    /// The winning ticket number (0-indexed)
    pub winning_ticket: u32,
    
    /// The winner's address (None if not set yet)
    pub winner: Option<Pubkey>,
    
    /// Whether the prize has been claimed
    pub is_claimed: bool,
    
    /// VRF request account (for verifiable randomness)
    pub vrf_request: Option<Pubkey>,
    
    /// VRF result (32 bytes of randomness)
    #[max_len(32)]
    pub vrf_result: Vec<u8>,
    
    /// Block slot when draw was requested (for timing verification)
    pub draw_requested_slot: u64,
    
    /// Timestamp when raffle was created
    pub created_at: i64,
    
    /// Total fees collected from this raffle
    pub fees_collected: u64,
    
    /// PDA bump seed for raffle
    pub bump: u8,
    
    /// PDA bump seed for vault
    pub vault_bump: u8,
}

// ============================================================================
// TICKET STATE
// ============================================================================

/// User ticket ownership record
#[account]
#[derive(InitSpace)]
pub struct Ticket {
    /// The raffle this ticket belongs to
    pub raffle: Pubkey,
    
    /// Owner of the ticket(s)
    pub owner: Pubkey,
    
    /// Starting ticket number (0-indexed)
    pub start_number: u32,
    
    /// Number of tickets owned
    pub quantity: u32,
    
    /// Timestamp of purchase
    pub purchased_at: i64,
    
    /// Transaction signature of purchase (for audit)
    #[max_len(64)]
    pub purchase_tx: Vec<u8>,
    
    /// PDA bump seed
    pub bump: u8,
}

// ============================================================================
// USER STATS (for rate limiting and analytics)
// ============================================================================

/// Per-user statistics and rate limiting
#[account]
#[derive(InitSpace)]
pub struct UserStats {
    /// User's wallet address
    pub wallet: Pubkey,
    
    /// Last ticket purchase timestamp (for rate limiting)
    pub last_purchase_time: i64,
    
    /// Total tickets bought across all raffles
    pub total_tickets_bought: u64,
    
    /// Total amount spent in lamports
    pub total_spent: u64,
    
    /// Number of wins
    pub total_wins: u32,
    
    /// Total winnings in lamports
    pub total_winnings: u64,
    
    /// Number of raffles participated in
    pub raffles_participated: u32,
    
    /// Is this user flagged for suspicious activity
    pub is_flagged: bool,
    
    /// When user was flagged
    pub flagged_at: i64,
    
    /// Reason for flagging (encoded)
    pub flag_reason: u8,
    
    /// PDA bump seed
    pub bump: u8,
}

// ============================================================================
// BLACKLIST ENTRY
// ============================================================================

/// Blacklisted wallet record
#[account]
#[derive(InitSpace)]
pub struct BlacklistEntry {
    /// The blacklisted wallet address
    pub wallet: Pubkey,
    
    /// When the wallet was blacklisted
    pub blacklisted_at: i64,
    
    /// Who blacklisted this wallet
    pub blacklisted_by: Pubkey,
    
    /// Reason code for blacklisting
    /// 1 = Bot behavior
    /// 2 = Fraudulent activity
    /// 3 = Terms violation
    /// 4 = Admin discretion
    pub reason: u8,
    
    /// Whether this entry is active
    pub is_active: bool,
    
    /// PDA bump seed
    pub bump: u8,
}

// ============================================================================
// SECURITY CONFIG
// ============================================================================

/// Global security configuration
#[account]
#[derive(InitSpace)]
pub struct SecurityConfig {
    /// Rate limit in seconds between purchases
    pub rate_limit_seconds: i64,
    
    /// Whether rate limiting is enabled
    pub rate_limiting_enabled: bool,
    
    /// Whether blacklist is enabled
    pub blacklist_enabled: bool,
    
    /// Whether VRF is required for draws
    pub vrf_required: bool,
    
    /// Minimum block confirmations for randomness
    pub min_block_confirmations: u64,
    
    /// Maximum tickets per wallet globally
    pub max_tickets_per_wallet: u32,
    
    /// Last update timestamp
    pub last_updated: i64,
    
    /// Who last updated the config
    pub updated_by: Pubkey,
    
    /// PDA bump seed
    pub bump: u8,
}

// ============================================================================
// IMPLEMENTATION HELPERS
// ============================================================================

impl Raffle {
    /// Check if raffle has ended based on timestamp
    pub fn has_ended(&self, current_time: i64) -> bool {
        current_time >= self.end_time
    }
    
    /// Check if raffle is active (not ended, not drawn, not paused)
    pub fn is_active(&self, current_time: i64) -> bool {
        !self.has_ended(current_time) && !self.is_drawn && !self.is_paused
    }
    
    /// Get remaining tickets
    pub fn remaining_tickets(&self) -> u32 {
        self.max_tickets.saturating_sub(self.tickets_sold)
    }
    
    /// Check if tickets can be purchased
    pub fn can_buy_tickets(&self, quantity: u32, current_time: i64) -> bool {
        self.is_active(current_time) && self.remaining_tickets() >= quantity
    }
}

impl UserStats {
    /// Check if user is rate limited
    pub fn is_rate_limited(&self, current_time: i64, rate_limit_seconds: i64) -> bool {
        current_time - self.last_purchase_time < rate_limit_seconds
    }
    
    /// Get time until rate limit expires
    pub fn rate_limit_remaining(&self, current_time: i64, rate_limit_seconds: i64) -> i64 {
        let elapsed = current_time - self.last_purchase_time;
        if elapsed >= rate_limit_seconds {
            0
        } else {
            rate_limit_seconds - elapsed
        }
    }
}

impl Platform {
    /// Check if admin transfer is pending
    pub fn has_pending_transfer(&self) -> bool {
        self.pending_admin.is_some()
    }
    
    /// Check if timelock has expired for admin transfer
    pub fn can_complete_transfer(&self, current_time: i64, timelock_seconds: i64) -> bool {
        if self.pending_admin.is_none() {
            return false;
        }
        current_time - self.admin_transfer_initiated_at >= timelock_seconds
    }
}
