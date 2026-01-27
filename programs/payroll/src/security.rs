// ============================================================================
// PAYROLL - Security Module
// ============================================================================

use anchor_lang::prelude::*;
use crate::state::{Platform, Raffle, UserStats, BlacklistEntry, SecurityConfig};
use crate::errors::PayrollError;
use crate::constants::*;

// ============================================================================
// SECURITY GUARDS
// ============================================================================

/// Reentrancy guard macro - use at the start of any function that transfers funds
#[macro_export]
macro_rules! reentrancy_guard {
    ($account:expr) => {
        require!(!$account.is_claiming, PayrollError::ReentrancyDetected);
        $account.is_claiming = true;
    };
}

/// Release reentrancy guard
#[macro_export]
macro_rules! reentrancy_release {
    ($account:expr) => {
        $account.is_claiming = false;
    };
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

/// Check if the platform is operational (not paused)
pub fn require_platform_active(platform: &Platform) -> Result<()> {
    require!(!platform.is_paused, PayrollError::PlatformPaused);
    Ok(())
}

/// Check if a raffle is operational (not paused)
pub fn require_raffle_active(raffle: &Raffle, current_time: i64) -> Result<()> {
    require!(!raffle.is_paused, PayrollError::RaffleAlreadyPaused);
    require!(raffle.is_active(current_time), PayrollError::RaffleEnded);
    Ok(())
}

/// Check if user is blacklisted
pub fn require_not_blacklisted(blacklist: Option<&Account<BlacklistEntry>>) -> Result<()> {
    if let Some(entry) = blacklist {
        require!(!entry.is_active, PayrollError::WalletBlacklisted);
    }
    Ok(())
}

/// Check rate limiting for a user
pub fn require_not_rate_limited(
    user_stats: &UserStats, 
    current_time: i64,
    config: &SecurityConfig,
) -> Result<()> {
    if !config.rate_limiting_enabled {
        return Ok(());
    }
    
    require!(
        !user_stats.is_rate_limited(current_time, config.rate_limit_seconds),
        PayrollError::RateLimitExceeded
    );
    Ok(())
}

/// Check admin authorization
pub fn require_admin(platform: &Platform, signer: &Pubkey) -> Result<()> {
    require!(platform.admin == *signer, PayrollError::Unauthorized);
    Ok(())
}

/// Check ticket limits per wallet
pub fn require_ticket_limit(
    current_tickets: u32,
    requested: u32,
    max_per_wallet: u32,
) -> Result<()> {
    if max_per_wallet == 0 {
        return Ok(()); // Unlimited
    }
    
    let total = current_tickets.checked_add(requested)
        .ok_or(PayrollError::MathOverflow)?;
        
    require!(
        total <= max_per_wallet,
        PayrollError::MaxTicketsPerWalletExceeded
    );
    Ok(())
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/// Validate raffle creation parameters
pub fn validate_raffle_params(
    prize_amount: u64,
    ticket_price: u64,
    max_tickets: u32,
    end_time: i64,
    current_time: i64,
    is_free: bool,
) -> Result<()> {
    // Prize amount validation
    require!(
        prize_amount >= MIN_PRIZE_AMOUNT,
        PayrollError::PrizeAmountBelowMin
    );
    require!(
        prize_amount <= MAX_PRIZE_AMOUNT,
        PayrollError::PrizeAmountExceedsMax
    );
    
    // Ticket price validation (only for paid raffles)
    if !is_free {
        require!(
            ticket_price >= MIN_TICKET_PRICE,
            PayrollError::TicketPriceBelowMin
        );
        require!(
            ticket_price <= MAX_TICKET_PRICE,
            PayrollError::TicketPriceExceedsMax
        );
    }
    
    // Max tickets validation
    require!(
        max_tickets > 0 && max_tickets <= MAX_TICKETS_PER_RAFFLE,
        PayrollError::InvalidTicketQuantity
    );
    
    // Duration validation
    let duration = end_time - current_time;
    require!(duration >= MIN_RAFFLE_DURATION, PayrollError::DurationTooShort);
    require!(duration <= MAX_RAFFLE_DURATION, PayrollError::DurationTooLong);
    
    Ok(())
}

/// Validate ticket purchase
pub fn validate_ticket_purchase(
    raffle: &Raffle,
    quantity: u32,
    current_time: i64,
) -> Result<()> {
    require!(quantity > 0, PayrollError::InvalidTicketQuantity);
    require!(!raffle.is_drawn, PayrollError::RaffleAlreadyDrawn);
    require!(current_time < raffle.end_time, PayrollError::RaffleEnded);
    require!(
        raffle.remaining_tickets() >= quantity,
        PayrollError::NotEnoughTickets
    );
    Ok(())
}

/// Validate draw conditions
pub fn validate_draw_conditions(
    raffle: &Raffle,
    current_time: i64,
    current_slot: u64,
    config: &SecurityConfig,
) -> Result<()> {
    require!(!raffle.is_drawn, PayrollError::RaffleAlreadyDrawn);
    require!(current_time >= raffle.end_time, PayrollError::RaffleNotEnded);
    require!(raffle.tickets_sold > 0, PayrollError::NoTicketsSold);
    
    // Check block confirmations for randomness security
    if raffle.draw_requested_slot > 0 {
        let confirmations = current_slot.saturating_sub(raffle.draw_requested_slot);
        require!(
            confirmations >= config.min_block_confirmations,
            PayrollError::InsufficientConfirmations
        );
    }
    
    Ok(())
}

/// Validate claim conditions
pub fn validate_claim_conditions(
    raffle: &Raffle,
    claimer: &Pubkey,
) -> Result<()> {
    require!(raffle.is_drawn, PayrollError::RaffleNotDrawn);
    require!(!raffle.is_claimed, PayrollError::PrizeAlreadyClaimed);
    require!(
        raffle.winner == Some(*claimer),
        PayrollError::NotTheWinner
    );
    Ok(())
}

// ============================================================================
// SECURE RANDOMNESS
// ============================================================================

/// Generate secure random number from multiple entropy sources
/// This is a fallback when VRF is not available
pub fn generate_secure_random(
    slot: u64,
    timestamp: i64,
    raffle_key: &Pubkey,
    blockhash: &[u8],
    tickets_sold: u32,
) -> Result<u32> {
    use anchor_lang::solana_program::hash::hash;
    
    // Combine multiple entropy sources
    let mut seed = Vec::with_capacity(128);
    seed.extend_from_slice(&slot.to_le_bytes());
    seed.extend_from_slice(&timestamp.to_le_bytes());
    seed.extend_from_slice(raffle_key.as_ref());
    seed.extend_from_slice(blockhash);
    seed.extend_from_slice(&tickets_sold.to_le_bytes());
    
    // Multiple hash passes for additional entropy mixing
    let hash1 = hash(&seed);
    seed.extend_from_slice(&hash1.to_bytes());
    let hash2 = hash(&seed);
    seed.extend_from_slice(&hash2.to_bytes());
    let final_hash = hash(&seed);
    
    // Extract random number from hash
    let random_bytes = &final_hash.to_bytes()[0..8];
    let random_number = u64::from_le_bytes(random_bytes.try_into().unwrap());
    
    // Map to ticket range
    let winning_ticket = (random_number % tickets_sold as u64) as u32;
    
    Ok(winning_ticket)
}

/// Verify VRF result and extract random number
pub fn verify_vrf_and_get_random(
    vrf_result: &[u8],
    tickets_sold: u32,
) -> Result<u32> {
    require!(!vrf_result.is_empty(), PayrollError::VrfResultNotAvailable);
    require!(vrf_result.len() >= 8, PayrollError::InvalidVrfProof);
    
    // Extract random number from VRF result
    let random_bytes: [u8; 8] = vrf_result[0..8].try_into()
        .map_err(|_| PayrollError::InvalidVrfProof)?;
    let random_number = u64::from_le_bytes(random_bytes);
    
    let winning_ticket = (random_number % tickets_sold as u64) as u32;
    
    Ok(winning_ticket)
}

// ============================================================================
// SAFE MATH OPERATIONS
// ============================================================================

/// Safe multiply with overflow check
pub fn safe_mul(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b).ok_or_else(|| error!(PayrollError::MathOverflow))
}

/// Safe add with overflow check
pub fn safe_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or_else(|| error!(PayrollError::MathOverflow))
}

/// Safe subtract with underflow check
pub fn safe_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or_else(|| error!(PayrollError::MathUnderflow))
}

/// Safe divide with zero check
pub fn safe_div(a: u64, b: u64) -> Result<u64> {
    require!(b != 0, PayrollError::DivisionByZero);
    Ok(a / b)
}

/// Calculate fee amount from total
pub fn calculate_fee(amount: u64, fee_bps: u16) -> Result<u64> {
    let fee = safe_mul(amount, fee_bps as u64)?;
    safe_div(fee, BPS_DENOMINATOR as u64)
}

/// Calculate amount after fee
pub fn amount_after_fee(amount: u64, fee_bps: u16) -> Result<u64> {
    let fee = calculate_fee(amount, fee_bps)?;
    safe_sub(amount, fee)
}

// ============================================================================
// EVENT LOGGING
// ============================================================================

/// Security event types for audit logging
#[event]
pub struct SecurityEvent {
    pub event_type: u8,
    pub actor: Pubkey,
    pub target: Option<Pubkey>,
    pub timestamp: i64,
    pub details: [u8; 32],
}

// Event type constants
pub const EVENT_BLACKLIST_ADD: u8 = 1;
pub const EVENT_BLACKLIST_REMOVE: u8 = 2;
pub const EVENT_PLATFORM_PAUSE: u8 = 3;
pub const EVENT_PLATFORM_UNPAUSE: u8 = 4;
pub const EVENT_ADMIN_TRANSFER_INIT: u8 = 5;
pub const EVENT_ADMIN_TRANSFER_COMPLETE: u8 = 6;
pub const EVENT_RATE_LIMIT_HIT: u8 = 7;
pub const EVENT_SUSPICIOUS_ACTIVITY: u8 = 8;
pub const EVENT_RAFFLE_PAUSE: u8 = 9;
pub const EVENT_RAFFLE_UNPAUSE: u8 = 10;

/// Emit security event
pub fn emit_security_event(
    event_type: u8,
    actor: Pubkey,
    target: Option<Pubkey>,
    timestamp: i64,
) {
    emit!(SecurityEvent {
        event_type,
        actor,
        target,
        timestamp,
        details: [0u8; 32],
    });
}
