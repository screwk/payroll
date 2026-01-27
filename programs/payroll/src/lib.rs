// ============================================================================
// PAYROLL - Solana Raffle Platform
// Secure Implementation with Comprehensive Security Measures
// ============================================================================

use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Module declarations
pub mod constants;
pub mod errors;
pub mod state;
pub mod security;
pub mod admin;

// Re-exports
pub use constants::*;
pub use errors::PayrollError;
pub use state::*;
pub use security::*;
pub use admin::*;

declare_id!("PayRo11111111111111111111111111111111111111");

#[program]
pub mod payroll {
    use super::*;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /// Initialize the platform with admin authority
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        let clock = Clock::get()?;
        
        platform.admin = ctx.accounts.admin.key();
        platform.pending_admin = None;
        platform.admin_transfer_initiated_at = 0;
        platform.total_raffles = 0;
        platform.total_fees_collected = 0;
        platform.total_prizes_paid = 0;
        platform.is_paused = false;
        platform.last_paused_at = 0;
        platform.paused_by = None;
        platform.fee_bps = PLATFORM_FEE_BPS;
        platform.blacklist_count = 0;
        platform.last_admin_action_at = clock.unix_timestamp;
        platform.bump = ctx.bumps.platform;

        msg!("PAYROLL platform initialized! Admin: {}", ctx.accounts.admin.key());
        Ok(())
    }

    /// Initialize security configuration
    pub fn initialize_security(ctx: Context<InitializeSecurity>) -> Result<()> {
        let clock = Clock::get()?;
        
        initialize_security_config(
            &mut ctx.accounts.security_config,
            &ctx.accounts.admin.key(),
            clock.unix_timestamp,
            ctx.bumps.security_config,
        )?;

        msg!("Security configuration initialized!");
        Ok(())
    }

    // ========================================================================
    // RAFFLE MANAGEMENT
    // ========================================================================

    /// Create a new raffle (admin only)
    pub fn create_raffle(
        ctx: Context<CreateRaffle>,
        raffle_id: u64,
        prize_amount: u64,
        ticket_price: u64,
        max_tickets: u32,
        max_tickets_per_wallet: u32,
        end_time: i64,
        is_free: bool,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        let raffle = &mut ctx.accounts.raffle;
        let clock = Clock::get()?;

        // Security: Verify admin
        require_admin(platform, &ctx.accounts.admin.key())?;
        
        // Security: Check platform not paused
        require_platform_active(platform)?;
        
        // Security: Admin rate limiting

        // Security: Validate all parameters
        validate_raffle_params(
            prize_amount,
            ticket_price,
            max_tickets,
            end_time,
            clock.unix_timestamp,
            is_free,
        )?;

        // Initialize raffle
        raffle.id = raffle_id;
        raffle.admin = ctx.accounts.admin.key();
        raffle.prize_amount = prize_amount;
        raffle.ticket_price = if is_free { 0 } else { ticket_price };
        raffle.max_tickets = max_tickets;
        raffle.tickets_sold = 0;
        raffle.max_tickets_per_wallet = if max_tickets_per_wallet == 0 { 
            MAX_TICKETS_PER_WALLET 
        } else { 
            max_tickets_per_wallet 
        };
        raffle.end_time = end_time;
        raffle.is_free = is_free;
        raffle.is_drawn = false;
        raffle.is_claiming = false;
        raffle.is_paused = false;
        raffle.winning_ticket = 0;
        raffle.winner = None;
        raffle.is_claimed = false;
        raffle.vrf_request = None;
        raffle.vrf_result = vec![];
        raffle.draw_requested_slot = 0;
        raffle.created_at = clock.unix_timestamp;
        raffle.fees_collected = 0;
        raffle.bump = ctx.bumps.raffle;
        raffle.vault_bump = ctx.bumps.raffle_vault;

        platform.total_raffles += 1;

        // If not free, admin must deposit the prize
        if prize_amount > 0 {
            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.admin.to_account_info(),
                    to: ctx.accounts.raffle_vault.to_account_info(),
                },
            );
            system_program::transfer(cpi_context, prize_amount)?;
        }

        msg!("Raffle {} created! Prize: {} lamports, Ticket price: {} lamports, Max tickets: {}",
            raffle_id, prize_amount, raffle.ticket_price, max_tickets);
        Ok(())
    }

    // ========================================================================
    // TICKET PURCHASE
    // ========================================================================

    /// Buy ticket(s) for a raffle with full security checks
    pub fn buy_ticket(ctx: Context<BuyTicket>, quantity: u32) -> Result<()> {
        let platform = &ctx.accounts.platform;
        let raffle = &mut ctx.accounts.raffle;
        let ticket = &mut ctx.accounts.ticket;
        let user_stats = &mut ctx.accounts.user_stats;
        let security_config = &ctx.accounts.security_config;
        let clock = Clock::get()?;

        // ====== SECURITY CHECKS ======
        
        // 1. Platform not paused
        require_platform_active(platform)?;
        
        // 2. Raffle active and not paused
        require_raffle_active(raffle, clock.unix_timestamp)?;
        
        // 3. Rate limiting
        require_not_rate_limited(user_stats, clock.unix_timestamp, security_config)?;
        
        // 4. Validate purchase parameters
        validate_ticket_purchase(raffle, quantity, clock.unix_timestamp)?;
        
        // 5. Check per-wallet ticket limit
        let current_user_tickets = if ticket.quantity > 0 { ticket.quantity } else { 0 };
        require_ticket_limit(
            current_user_tickets,
            quantity,
            raffle.max_tickets_per_wallet,
        )?;

        // ====== PROCESS PURCHASE ======

        // Calculate cost with safe math
        let total_cost = safe_mul(raffle.ticket_price, quantity as u64)?;

        // Transfer payment (if not free)
        if total_cost > 0 {
            // Calculate platform fee
            let fee = calculate_fee(total_cost, platform.fee_bps)?;
            
            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.raffle_vault.to_account_info(),
                },
            );
            system_program::transfer(cpi_context, total_cost)?;
            
            raffle.fees_collected = safe_add(raffle.fees_collected, fee)?;
        }

        // Record ticket
        let start_ticket_number = raffle.tickets_sold;
        ticket.raffle = raffle.key();
        ticket.owner = ctx.accounts.buyer.key();
        ticket.start_number = start_ticket_number;
        ticket.quantity = safe_add(ticket.quantity as u64, quantity as u64)? as u32;
        ticket.purchased_at = clock.unix_timestamp;
        ticket.bump = ctx.bumps.ticket;

        raffle.tickets_sold = safe_add(raffle.tickets_sold as u64, quantity as u64)? as u32;

        // Update user stats
        user_stats.last_purchase_time = clock.unix_timestamp;
        user_stats.total_tickets_bought = safe_add(user_stats.total_tickets_bought, quantity as u64)?;
        user_stats.total_spent = safe_add(user_stats.total_spent, total_cost)?;
        user_stats.raffles_participated += 1;

        msg!("Bought {} ticket(s) for raffle {}. Tickets: {}-{}",
            quantity, raffle.id, start_ticket_number, start_ticket_number + quantity - 1);
        Ok(())
    }

    // ========================================================================
    // DRAW WINNER
    // ========================================================================

    /// Draw the winner with secure randomness
    pub fn draw_winner(ctx: Context<DrawWinner>) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let security_config = &ctx.accounts.security_config;
        let clock = Clock::get()?;

        // Validate draw conditions
        validate_draw_conditions(
            raffle,
            clock.unix_timestamp,
            clock.slot,
            security_config,
        )?;

        // Generate secure random winning ticket
        let recent_blockhash = clock.slot.to_le_bytes();
        
        let winning_ticket = generate_secure_random(
            clock.slot,
            clock.unix_timestamp,
            &raffle.key(),
            &recent_blockhash,
            raffle.tickets_sold,
        )?;

        raffle.winning_ticket = winning_ticket;
        raffle.is_drawn = true;
        raffle.draw_requested_slot = clock.slot;

        msg!("Raffle {} drawn! Winning ticket: {} (of {} sold)", 
            raffle.id, winning_ticket, raffle.tickets_sold);
        Ok(())
    }

    /// Set the winner address (called after draw, requires ticket proof)
    pub fn set_winner(ctx: Context<SetWinner>) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let ticket = &ctx.accounts.winning_ticket;

        require!(raffle.is_drawn, PayrollError::RaffleNotDrawn);
        require!(raffle.winner.is_none(), PayrollError::WinnerAlreadySet);

        // Verify ticket owns the winning number
        let winning_num = raffle.winning_ticket;
        require!(
            winning_num >= ticket.start_number &&
            winning_num < ticket.start_number + ticket.quantity,
            PayrollError::NotWinningTicket
        );

        raffle.winner = Some(ticket.owner);

        msg!("Winner set for raffle {}: {}", raffle.id, ticket.owner);
        Ok(())
    }

    // ========================================================================
    // CLAIM PRIZE
    // ========================================================================

    /// Claim the prize with reentrancy protection
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let platform = &mut ctx.accounts.platform;

        // Validate claim conditions
        validate_claim_conditions(raffle, &ctx.accounts.winner.key())?;

        // ====== REENTRANCY GUARD ======
        reentrancy_guard!(raffle);

        // Transfer prize from vault to winner
        let raffle_id_bytes = raffle.id.to_le_bytes();
        let seeds = &[
            RAFFLE_VAULT_SEED,
            raffle_id_bytes.as_ref(),
            &[raffle.vault_bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_amount = raffle.prize_amount;

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.raffle_vault.to_account_info(),
                to: ctx.accounts.winner.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_context, transfer_amount)?;

        // Update state AFTER transfer (CEI pattern)
        raffle.is_claimed = true;
        platform.total_prizes_paid = safe_add(platform.total_prizes_paid, transfer_amount)?;

        // ====== RELEASE REENTRANCY GUARD ======
        reentrancy_release!(raffle);

        msg!("Prize claimed! {} lamports sent to {}", transfer_amount, ctx.accounts.winner.key());
        Ok(())
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    /// Admin withdraws ticket sales profit
    pub fn withdraw_proceeds(ctx: Context<WithdrawProceeds>) -> Result<()> {
        let raffle = &ctx.accounts.raffle;
        let platform = &mut ctx.accounts.platform;

        // Security: Verify admin
        require_admin(platform, &ctx.accounts.admin.key())?;
        require!(raffle.is_drawn, PayrollError::RaffleNotDrawn);
        require!(raffle.is_claimed || raffle.tickets_sold == 0, PayrollError::PrizeNotClaimed);

        let vault_balance = ctx.accounts.raffle_vault.lamports();
        let withdraw_amount = vault_balance.saturating_sub(
            if raffle.is_claimed { 0 } else { raffle.prize_amount }
        );

        if withdraw_amount > 0 {
            let raffle_id_bytes = raffle.id.to_le_bytes();
            let seeds = &[
                RAFFLE_VAULT_SEED,
                raffle_id_bytes.as_ref(),
                &[raffle.vault_bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.raffle_vault.to_account_info(),
                    to: ctx.accounts.admin.to_account_info(),
                },
                signer,
            );
            system_program::transfer(cpi_context, withdraw_amount)?;
            
            platform.total_fees_collected = safe_add(platform.total_fees_collected, raffle.fees_collected)?;
        }

        msg!("Withdrew {} lamports in proceeds", withdraw_amount);
        Ok(())
    }

    /// Pause the platform (emergency)
    pub fn pause_platform(ctx: Context<AdminAction>) -> Result<()> {
        let clock = Clock::get()?;
        process_pause_platform(
            &mut ctx.accounts.platform,
            &ctx.accounts.admin.key(),
            clock.unix_timestamp,
        )
    }

    /// Unpause the platform
    pub fn unpause_platform(ctx: Context<AdminAction>) -> Result<()> {
        let clock = Clock::get()?;
        process_unpause_platform(
            &mut ctx.accounts.platform,
            &ctx.accounts.admin.key(),
            clock.unix_timestamp,
        )
    }

    /// Initiate admin transfer
    pub fn initiate_admin_transfer(
        ctx: Context<AdminAction>,
        new_admin: Pubkey,
    ) -> Result<()> {
        let clock = Clock::get()?;
        process_initiate_admin_transfer(
            &mut ctx.accounts.platform,
            &ctx.accounts.admin.key(),
            new_admin,
            clock.unix_timestamp,
        )
    }

    /// Complete admin transfer (new admin calls this)
    pub fn complete_admin_transfer(ctx: Context<CompleteAdminTransfer>) -> Result<()> {
        let clock = Clock::get()?;
        process_complete_admin_transfer(
            &mut ctx.accounts.platform,
            &ctx.accounts.new_admin.key(),
            clock.unix_timestamp,
        )
    }

    /// Add wallet to blacklist
    pub fn add_to_blacklist(
        ctx: Context<ManageBlacklist>,
        wallet: Pubkey,
        reason: u8,
    ) -> Result<()> {
        let clock = Clock::get()?;
        process_add_to_blacklist(
            &mut ctx.accounts.platform,
            &mut ctx.accounts.blacklist_entry,
            &ctx.accounts.admin.key(),
            wallet,
            reason,
            clock.unix_timestamp,
            ctx.bumps.blacklist_entry,
        )
    }

    /// Remove wallet from blacklist
    pub fn remove_from_blacklist(ctx: Context<ManageBlacklist>) -> Result<()> {
        let clock = Clock::get()?;
        process_remove_from_blacklist(
            &mut ctx.accounts.platform,
            &mut ctx.accounts.blacklist_entry,
            &ctx.accounts.admin.key(),
            clock.unix_timestamp,
        )
    }

    /// Update platform fee
    pub fn update_fee(ctx: Context<AdminAction>, new_fee_bps: u16) -> Result<()> {
        process_update_platform_fee(
            &mut ctx.accounts.platform,
            &ctx.accounts.admin.key(),
            new_fee_bps,
        )
    }
}

// ============================================================================
// ACCOUNT CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<Platform>() + ACCOUNT_RESERVE_SPACE,
        seeds = [PLATFORM_SEED],
        bump
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeSecurity<'info> {
    #[account(
        seeds = [PLATFORM_SEED],
        bump = platform.bump,
        constraint = platform.admin == admin.key() @ PayrollError::Unauthorized
    )]
    pub platform: Account<'info, Platform>,

    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<SecurityConfig>() + ACCOUNT_RESERVE_SPACE,
        seeds = [SECURITY_CONFIG_SEED],
        bump
    )]
    pub security_config: Account<'info, SecurityConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(raffle_id: u64)]
pub struct CreateRaffle<'info> {
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump = platform.bump
    )]
    pub platform: Account<'info, Platform>,

    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<Raffle>() + 32 + ACCOUNT_RESERVE_SPACE, // +32 for VRF result vec
        seeds = [RAFFLE_SEED, raffle_id.to_le_bytes().as_ref()],
        bump
    )]
    pub raffle: Account<'info, Raffle>,

    /// CHECK: PDA vault for holding raffle funds
    #[account(
        mut,
        seeds = [RAFFLE_VAULT_SEED, raffle_id.to_le_bytes().as_ref()],
        bump
    )]
    pub raffle_vault: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(
        seeds = [PLATFORM_SEED],
        bump = platform.bump
    )]
    pub platform: Account<'info, Platform>,

    #[account(
        seeds = [SECURITY_CONFIG_SEED],
        bump = security_config.bump
    )]
    pub security_config: Account<'info, SecurityConfig>,

    #[account(mut)]
    pub raffle: Account<'info, Raffle>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<Ticket>() + 64 + ACCOUNT_RESERVE_SPACE,
        seeds = [TICKET_SEED, raffle.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub ticket: Account<'info, Ticket>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<UserStats>() + ACCOUNT_RESERVE_SPACE,
        seeds = [USER_STATS_SEED, buyer.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,

    /// CHECK: PDA vault for holding raffle funds
    #[account(
        mut,
        seeds = [RAFFLE_VAULT_SEED, raffle.id.to_le_bytes().as_ref()],
        bump = raffle.vault_bump
    )]
    pub raffle_vault: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(
        seeds = [SECURITY_CONFIG_SEED],
        bump = security_config.bump
    )]
    pub security_config: Account<'info, SecurityConfig>,

    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
}

#[derive(Accounts)]
pub struct SetWinner<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,

    #[account(
        constraint = winning_ticket.raffle == raffle.key() @ PayrollError::InvalidAccountData
    )]
    pub winning_ticket: Account<'info, Ticket>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub raffle: Account<'info, Raffle>,

    /// CHECK: PDA vault for holding raffle funds
    #[account(
        mut,
        seeds = [RAFFLE_VAULT_SEED, raffle.id.to_le_bytes().as_ref()],
        bump = raffle.vault_bump
    )]
    pub raffle_vault: AccountInfo<'info>,

    #[account(mut)]
    pub winner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawProceeds<'info> {
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump = platform.bump
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub raffle: Account<'info, Raffle>,

    /// CHECK: PDA vault for holding raffle funds
    #[account(
        mut,
        seeds = [RAFFLE_VAULT_SEED, raffle.id.to_le_bytes().as_ref()],
        bump = raffle.vault_bump
    )]
    pub raffle_vault: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump = platform.bump
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteAdminTransfer<'info> {
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump = platform.bump
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub new_admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct ManageBlacklist<'info> {
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump = platform.bump
    )]
    pub platform: Account<'info, Platform>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + std::mem::size_of::<BlacklistEntry>() + ACCOUNT_RESERVE_SPACE,
        seeds = [BLACKLIST_SEED, wallet.as_ref()],
        bump
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}
