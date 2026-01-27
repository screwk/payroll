// ============================================================================
// PAYROLL - Error Codes
// ============================================================================

use anchor_lang::prelude::*;

#[error_code]
pub enum PayrollError {
    // ========================================================================
    // Authorization Errors (6000-6099)
    // ========================================================================
    
    #[msg("You are not authorized to perform this action")]
    Unauthorized = 6000,
    
    #[msg("Invalid admin signature")]
    InvalidAdminSignature = 6001,
    
    #[msg("Pending admin does not match")]
    InvalidPendingAdmin = 6002,
    
    #[msg("Admin transfer not initiated")]
    AdminTransferNotInitiated = 6003,
    
    // ========================================================================
    // Raffle State Errors (6100-6199)
    // ========================================================================
    
    #[msg("Raffle has already been drawn")]
    RaffleAlreadyDrawn = 6100,
    
    #[msg("Raffle has not ended yet")]
    RaffleNotEnded = 6101,
    
    #[msg("Raffle has ended")]
    RaffleEnded = 6102,
    
    #[msg("Raffle has not been drawn yet")]
    RaffleNotDrawn = 6103,
    
    #[msg("Raffle is already paused")]
    RaffleAlreadyPaused = 6104,
    
    #[msg("Raffle is not paused")]
    RaffleNotPaused = 6105,
    
    #[msg("Invalid raffle ID")]
    InvalidRaffleId = 6106,
    
    // ========================================================================
    // Ticket Errors (6200-6299)
    // ========================================================================
    
    #[msg("Not enough tickets available")]
    NotEnoughTickets = 6200,
    
    #[msg("No tickets were sold")]
    NoTicketsSold = 6201,
    
    #[msg("This ticket is not the winning ticket")]
    NotWinningTicket = 6202,
    
    #[msg("Maximum tickets per wallet exceeded")]
    MaxTicketsPerWalletExceeded = 6203,
    
    #[msg("Invalid ticket quantity - must be greater than 0")]
    InvalidTicketQuantity = 6204,
    
    #[msg("Ticket already exists for this user in this raffle")]
    TicketAlreadyExists = 6205,
    
    // ========================================================================
    // Prize & Financial Errors (6300-6399)
    // ========================================================================
    
    #[msg("Prize has already been claimed")]
    PrizeAlreadyClaimed = 6300,
    
    #[msg("You are not the winner")]
    NotTheWinner = 6301,
    
    #[msg("Prize has not been claimed yet")]
    PrizeNotClaimed = 6302,
    
    #[msg("Winner has already been set")]
    WinnerAlreadySet = 6303,
    
    #[msg("Prize amount exceeds maximum allowed")]
    PrizeAmountExceedsMax = 6304,
    
    #[msg("Prize amount below minimum required")]
    PrizeAmountBelowMin = 6305,
    
    #[msg("Ticket price below minimum required")]
    TicketPriceBelowMin = 6306,
    
    #[msg("Ticket price exceeds maximum allowed")]
    TicketPriceExceedsMax = 6307,
    
    #[msg("Insufficient funds in vault")]
    InsufficientVaultFunds = 6308,
    
    // ========================================================================
    // Security Errors (6400-6499)
    // ========================================================================
    
    #[msg("Platform is currently paused")]
    PlatformPaused = 6400,
    
    #[msg("This wallet is blacklisted")]
    WalletBlacklisted = 6401,
    
    #[msg("Rate limit exceeded - please wait before trying again")]
    RateLimitExceeded = 6402,
    
    #[msg("Reentrancy detected - transaction rejected")]
    ReentrancyDetected = 6403,
    
    #[msg("Timelock period has not expired")]
    TimelockNotExpired = 6404,
    
    #[msg("Action requires timelock")]
    TimelockRequired = 6405,
    
    #[msg("Insufficient block confirmations for secure randomness")]
    InsufficientConfirmations = 6406,
    
    // ========================================================================
    // VRF Errors (6500-6599)
    // ========================================================================
    
    #[msg("VRF request is pending")]
    VrfRequestPending = 6500,
    
    #[msg("VRF request has expired")]
    VrfRequestExpired = 6501,
    
    #[msg("Invalid VRF proof")]
    InvalidVrfProof = 6502,
    
    #[msg("VRF callback mismatch")]
    VrfCallbackMismatch = 6503,
    
    #[msg("VRF result not available")]
    VrfResultNotAvailable = 6504,
    
    // ========================================================================
    // Math & Validation Errors (6600-6699)
    // ========================================================================
    
    #[msg("Math overflow occurred")]
    MathOverflow = 6600,
    
    #[msg("Math underflow occurred")]
    MathUnderflow = 6601,
    
    #[msg("Division by zero")]
    DivisionByZero = 6602,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp = 6603,
    
    #[msg("Invalid duration - too short")]
    DurationTooShort = 6604,
    
    #[msg("Invalid duration - too long")]
    DurationTooLong = 6605,
    
    #[msg("Invalid account data")]
    InvalidAccountData = 6606,
    
    #[msg("Invalid PDA derivation")]
    InvalidPDA = 6607,
    
    // ========================================================================
    // Account Errors (6700-6799)
    // ========================================================================
    
    #[msg("Account not initialized")]
    AccountNotInitialized = 6700,
    
    #[msg("Account already initialized")]
    AccountAlreadyInitialized = 6701,
    
    #[msg("Invalid account owner")]
    InvalidAccountOwner = 6702,
    
    #[msg("Account data mismatch")]
    AccountDataMismatch = 6703,
    
    #[msg("Invalid vault account")]
    InvalidVault = 6704,
}
