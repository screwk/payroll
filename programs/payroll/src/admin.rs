// ============================================================================
// PAYROLL - Admin Controls Module
// ============================================================================

use anchor_lang::prelude::*;
use crate::state::{Platform, Raffle, BlacklistEntry, SecurityConfig};
use crate::errors::PayrollError;
use crate::constants::*;
use crate::security::{
    require_admin, 
    emit_security_event,
    EVENT_PLATFORM_PAUSE, 
    EVENT_PLATFORM_UNPAUSE,
    EVENT_ADMIN_TRANSFER_INIT,
    EVENT_ADMIN_TRANSFER_COMPLETE,
    EVENT_BLACKLIST_ADD,
    EVENT_BLACKLIST_REMOVE,
};

// ============================================================================
// ADMIN INSTRUCTIONS
// ============================================================================

/// Initialize admin transfer (2-step process)
pub fn process_initiate_admin_transfer(
    platform: &mut Platform,
    current_admin: &Pubkey,
    new_admin: Pubkey,
    current_time: i64,
) -> Result<()> {
    // Verify current admin
    require_admin(platform, current_admin)?;
    
    // Cannot transfer to self
    require!(
        *current_admin != new_admin,
        PayrollError::InvalidPendingAdmin
    );
    
    // Set pending admin and timestamp
    platform.pending_admin = Some(new_admin);
    platform.admin_transfer_initiated_at = current_time;
    
    // Emit event
    emit_security_event(
        EVENT_ADMIN_TRANSFER_INIT,
        *current_admin,
        Some(new_admin),
        current_time,
    );
    
    msg!("Admin transfer initiated to: {}", new_admin);
    Ok(())
}

/// Complete admin transfer (after timelock)
pub fn process_complete_admin_transfer(
    platform: &mut Platform,
    new_admin: &Pubkey,
    current_time: i64,
) -> Result<()> {
    // Verify pending admin matches signer
    require!(
        platform.pending_admin == Some(*new_admin),
        PayrollError::InvalidPendingAdmin
    );
    
    // Check timelock has expired
    require!(
        platform.can_complete_transfer(current_time, ADMIN_TIMELOCK_SECONDS),
        PayrollError::TimelockNotExpired
    );
    
    let old_admin = platform.admin;
    
    // Complete transfer
    platform.admin = *new_admin;
    platform.pending_admin = None;
    platform.admin_transfer_initiated_at = 0;
    
    // Emit event
    emit_security_event(
        EVENT_ADMIN_TRANSFER_COMPLETE,
        *new_admin,
        Some(old_admin),
        current_time,
    );
    
    msg!("Admin transfer completed. New admin: {}", new_admin);
    Ok(())
}

/// Cancel pending admin transfer
pub fn process_cancel_admin_transfer(
    platform: &mut Platform,
    current_admin: &Pubkey,
    current_time: i64,
) -> Result<()> {
    require_admin(platform, current_admin)?;
    
    require!(
        platform.pending_admin.is_some(),
        PayrollError::AdminTransferNotInitiated
    );
    
    let pending = platform.pending_admin;
    platform.pending_admin = None;
    platform.admin_transfer_initiated_at = 0;
    
    msg!("Admin transfer cancelled. Was pending: {:?}", pending);
    Ok(())
}

// ============================================================================
// PLATFORM PAUSE / UNPAUSE
// ============================================================================

/// Pause the entire platform (emergency stop)
pub fn process_pause_platform(
    platform: &mut Platform,
    admin: &Pubkey,
    current_time: i64,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    require!(!platform.is_paused, PayrollError::RaffleAlreadyPaused);
    
    platform.is_paused = true;
    platform.last_paused_at = current_time;
    platform.paused_by = Some(*admin);
    
    emit_security_event(
        EVENT_PLATFORM_PAUSE,
        *admin,
        None,
        current_time,
    );
    
    msg!("Platform PAUSED by admin: {}", admin);
    Ok(())
}

/// Unpause the platform
pub fn process_unpause_platform(
    platform: &mut Platform,
    admin: &Pubkey,
    current_time: i64,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    require!(platform.is_paused, PayrollError::RaffleNotPaused);
    
    platform.is_paused = false;
    platform.paused_by = None;
    
    emit_security_event(
        EVENT_PLATFORM_UNPAUSE,
        *admin,
        None,
        current_time,
    );
    
    msg!("Platform UNPAUSED by admin: {}", admin);
    Ok(())
}

// ============================================================================
// RAFFLE PAUSE / UNPAUSE
// ============================================================================

/// Pause a specific raffle
pub fn process_pause_raffle(
    platform: &Platform,
    raffle: &mut Raffle,
    admin: &Pubkey,
    current_time: i64,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    require!(!raffle.is_paused, PayrollError::RaffleAlreadyPaused);
    require!(!raffle.is_drawn, PayrollError::RaffleAlreadyDrawn);
    
    raffle.is_paused = true;
    
    msg!("Raffle {} PAUSED", raffle.id);
    Ok(())
}

/// Unpause a specific raffle
pub fn process_unpause_raffle(
    platform: &Platform,
    raffle: &mut Raffle,
    admin: &Pubkey,
    current_time: i64,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    require!(raffle.is_paused, PayrollError::RaffleNotPaused);
    
    raffle.is_paused = false;
    
    msg!("Raffle {} UNPAUSED", raffle.id);
    Ok(())
}

// ============================================================================
// BLACKLIST MANAGEMENT
// ============================================================================

/// Add wallet to blacklist
pub fn process_add_to_blacklist(
    platform: &mut Platform,
    blacklist_entry: &mut BlacklistEntry,
    admin: &Pubkey,
    wallet_to_blacklist: Pubkey,
    reason: u8,
    current_time: i64,
    bump: u8,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    // Initialize blacklist entry
    blacklist_entry.wallet = wallet_to_blacklist;
    blacklist_entry.blacklisted_at = current_time;
    blacklist_entry.blacklisted_by = *admin;
    blacklist_entry.reason = reason;
    blacklist_entry.is_active = true;
    blacklist_entry.bump = bump;
    
    platform.blacklist_count += 1;
    
    emit_security_event(
        EVENT_BLACKLIST_ADD,
        *admin,
        Some(wallet_to_blacklist),
        current_time,
    );
    
    msg!("Wallet {} added to blacklist. Reason: {}", wallet_to_blacklist, reason);
    Ok(())
}

/// Remove wallet from blacklist
pub fn process_remove_from_blacklist(
    platform: &mut Platform,
    blacklist_entry: &mut BlacklistEntry,
    admin: &Pubkey,
    current_time: i64,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    require!(blacklist_entry.is_active, PayrollError::WalletBlacklisted);
    
    let wallet = blacklist_entry.wallet;
    blacklist_entry.is_active = false;
    
    if platform.blacklist_count > 0 {
        platform.blacklist_count -= 1;
    }
    
    emit_security_event(
        EVENT_BLACKLIST_REMOVE,
        *admin,
        Some(wallet),
        current_time,
    );
    
    msg!("Wallet {} removed from blacklist", wallet);
    Ok(())
}

// ============================================================================
// SECURITY CONFIG MANAGEMENT
// ============================================================================

/// Update security configuration
pub fn process_update_security_config(
    platform: &Platform,
    config: &mut SecurityConfig,
    admin: &Pubkey,
    rate_limit_seconds: Option<i64>,
    rate_limiting_enabled: Option<bool>,
    blacklist_enabled: Option<bool>,
    vrf_required: Option<bool>,
    min_block_confirmations: Option<u64>,
    max_tickets_per_wallet: Option<u32>,
    current_time: i64,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    // Update only provided fields
    if let Some(v) = rate_limit_seconds {
        config.rate_limit_seconds = v;
    }
    if let Some(v) = rate_limiting_enabled {
        config.rate_limiting_enabled = v;
    }
    if let Some(v) = blacklist_enabled {
        config.blacklist_enabled = v;
    }
    if let Some(v) = vrf_required {
        config.vrf_required = v;
    }
    if let Some(v) = min_block_confirmations {
        config.min_block_confirmations = v;
    }
    if let Some(v) = max_tickets_per_wallet {
        config.max_tickets_per_wallet = v;
    }
    
    config.last_updated = current_time;
    config.updated_by = *admin;
    
    msg!("Security config updated by admin: {}", admin);
    Ok(())
}

/// Initialize security configuration with defaults
pub fn initialize_security_config(
    config: &mut SecurityConfig,
    admin: &Pubkey,
    current_time: i64,
    bump: u8,
) -> Result<()> {
    config.rate_limit_seconds = RATE_LIMIT_SECONDS;
    config.rate_limiting_enabled = true;
    config.blacklist_enabled = true;
    config.vrf_required = false; // Can enable when VRF is set up
    config.min_block_confirmations = MIN_BLOCK_CONFIRMATIONS;
    config.max_tickets_per_wallet = MAX_TICKETS_PER_WALLET;
    config.last_updated = current_time;
    config.updated_by = *admin;
    config.bump = bump;
    
    msg!("Security config initialized with defaults");
    Ok(())
}

// ============================================================================
// FEE MANAGEMENT
// ============================================================================

/// Update platform fee (with limits)
pub fn process_update_platform_fee(
    platform: &mut Platform,
    admin: &Pubkey,
    new_fee_bps: u16,
) -> Result<()> {
    require_admin(platform, admin)?;
    
    // Validate fee is within allowed range
    require!(
        new_fee_bps <= MAX_PLATFORM_FEE_BPS,
        PayrollError::PrizeAmountExceedsMax // Reusing error
    );
    
    platform.fee_bps = new_fee_bps;
    
    msg!("Platform fee updated to {} basis points ({}%)", 
        new_fee_bps, 
        new_fee_bps as f32 / 100.0
    );
    Ok(())
}

// ============================================================================
// ADMIN RATE LIMITING
// ============================================================================

/// Check and update admin rate limit
pub fn check_admin_rate_limit(
    platform: &mut Platform,
    current_time: i64,
) -> Result<()> {
    let elapsed = current_time - platform.last_admin_action_at;
    
    require!(
        elapsed >= ADMIN_RATE_LIMIT_SECONDS,
        PayrollError::RateLimitExceeded
    );
    
    platform.last_admin_action_at = current_time;
    Ok(())
}
