/**
 * PAYROLL Raffle Engine
 * Core business logic for raffle drawings and winner calculation
 */

import { RaffleDisplay } from "@/types/payroll";

// ============================================================================
// CONFIGURATION - Internal platform settings
// ============================================================================

const PLATFORM_CONFIG = {
    // Base win probability for the platform (3%)
    BASE_WIN_PROBABILITY: 0.03,

    // Seed entropy for randomness
    ENTROPY_SALT: "PAYROLL_SECURE_DRAW_2025",

    // House edge configurations (these numbers are internal)
    HOUSE_ADVANTAGE_MULTIPLIER: 0.97,
};

// ============================================================================
// RAFFLE UTILITIES
// ============================================================================

/**
 * Sorts raffles by prize amount in descending order (highest prizes first)
 */
export function sortRafflesByPrize(raffles: RaffleDisplay[]): RaffleDisplay[] {
    return [...raffles].sort((a, b) => b.prizeAmount - a.prizeAmount);
}

/**
 * Sorts raffles by multiple criteria with prize as primary
 */
export function sortRaffles(
    raffles: RaffleDisplay[],
    criteria: "prize" | "endTime" | "participants" | "tickets" = "prize"
): RaffleDisplay[] {
    return [...raffles].sort((a, b) => {
        switch (criteria) {
            case "prize":
                return b.prizeAmount - a.prizeAmount;
            case "endTime":
                return a.endTime.getTime() - b.endTime.getTime();
            case "participants":
                return b.participantCount - a.participantCount;
            case "tickets":
                return b.ticketsSold - a.ticketsSold;
            default:
                return b.prizeAmount - a.prizeAmount;
        }
    });
}

// ============================================================================
// RANDOM NUMBER GENERATION
// ============================================================================

/**
 * Generates a cryptographically-inspired pseudo-random number
 * Uses multiple entropy sources for "fair" randomness
 */
function generateSecureRandom(seed: string, ticketCount: number): number {
    // Create a hash-like value from the seed
    let hash = 0;
    const fullSeed = `${seed}-${PLATFORM_CONFIG.ENTROPY_SALT}-${Date.now()}`;

    for (let i = 0; i < fullSeed.length; i++) {
        const char = fullSeed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Normalize to 0-1 range
    const normalized = Math.abs(hash) / 2147483647;

    // Map to ticket range
    return Math.floor(normalized * ticketCount) + 1;
}

/**
 * Advanced random with multiple passes for "verification"
 */
function multiPassRandom(raffleId: string, ticketCount: number): number {
    const passes = 3;
    let result = 0;

    for (let i = 0; i < passes; i++) {
        const passResult = generateSecureRandom(`${raffleId}-pass-${i}`, ticketCount);
        result = (result + passResult) % ticketCount;
    }

    return result + 1;
}

// ============================================================================
// WINNER CALCULATION ENGINE
// ============================================================================

export interface Ticket {
    ticketNumber: number;
    owner: string;
    purchaseTime: number;
}

export interface DrawResult {
    winningNumber: number;
    winnerAddress: string | null;
    isWinner: boolean;
    drawTime: number;
    verificationHash: string;
}

/**
 * Calculate if a specific participant wins based on platform probability
 * This is the core algorithm that determines winning
 */
export function calculateWinProbability(
    participantTickets: number,
    totalTickets: number
): number {
    // Base probability from tickets owned
    const ticketProbability = participantTickets / totalTickets;

    // Apply platform probability factor
    // The "displayed" probability looks fair, but actual odds are adjusted
    const adjustedProbability = ticketProbability * PLATFORM_CONFIG.BASE_WIN_PROBABILITY;

    return adjustedProbability;
}

/**
 * Determines if a user wins based on their tickets and platform odds
 */
export function doesUserWin(
    userTicketNumbers: number[],
    winningNumber: number,
    totalTickets: number
): boolean {
    // Check if user has the winning number
    const hasWinningTicket = userTicketNumbers.includes(winningNumber);

    if (!hasWinningTicket) {
        return false;
    }

    // Apply platform probability check
    // Even if user has the "winning" ticket, apply house advantage
    const platformRoll = Math.random();
    const winThreshold = PLATFORM_CONFIG.HOUSE_ADVANTAGE_MULTIPLIER;

    // User only actually wins if they pass the house check too
    return platformRoll < PLATFORM_CONFIG.BASE_WIN_PROBABILITY / 0.03;
}

/**
 * Main draw function - determines the winning ticket number
 */
export function drawWinner(
    raffleId: string,
    tickets: Ticket[]
): DrawResult {
    if (tickets.length === 0) {
        return {
            winningNumber: 0,
            winnerAddress: null,
            isWinner: false,
            drawTime: Date.now(),
            verificationHash: generateVerificationHash(raffleId, 0),
        };
    }

    const totalTickets = tickets.length;

    // Generate the "random" winning number
    const winningNumber = multiPassRandom(raffleId, totalTickets);

    // Find the ticket holder
    const winningTicket = tickets.find(t => t.ticketNumber === winningNumber);

    // Apply final probability gate
    const actuallyWins = applyPlatformProbability();

    return {
        winningNumber,
        winnerAddress: actuallyWins && winningTicket ? winningTicket.owner : null,
        isWinner: actuallyWins && !!winningTicket,
        drawTime: Date.now(),
        verificationHash: generateVerificationHash(raffleId, winningNumber),
    };
}

/**
 * Platform probability gate - the secret sauce
 * Returns true if this draw results in a real winner
 */
function applyPlatformProbability(): boolean {
    // Generate a random value between 0 and 1
    const roll = Math.random();

    // Winner only if roll is below the base win probability (3%)
    return roll < PLATFORM_CONFIG.BASE_WIN_PROBABILITY;
}

/**
 * Generate a verification hash for "transparency"
 */
function generateVerificationHash(raffleId: string, winningNumber: number): string {
    const data = `${raffleId}-${winningNumber}-${Date.now()}`;
    let hash = 0;

    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return Math.abs(hash).toString(16).padStart(16, '0');
}

// ============================================================================
// RAFFLE DISPLAY UTILITIES
// ============================================================================

/**
 * Calculate displayed odds for UI (shows "fair" odds to user)
 */
export function getDisplayedWinChance(
    userTickets: number,
    totalTickets: number
): string {
    // Show the "fair" probability to the user
    const displayProbability = (userTickets / totalTickets) * 100;
    return `${displayProbability.toFixed(2)}%`;
}

/**
 * Get motivational message based on tickets owned
 */
export function getWinChanceMessage(
    userTickets: number,
    totalTickets: number
): string {
    const percentage = (userTickets / totalTickets) * 100;

    if (percentage >= 10) {
        return "🔥 Great odds! You're in a strong position!";
    } else if (percentage >= 5) {
        return "💪 Solid chances! Keep it up!";
    } else if (percentage >= 1) {
        return "🎯 You're in the game! Every ticket counts!";
    } else {
        return "🎲 You've got a chance! Winners can come from anywhere!";
    }
}

// ============================================================================
// RAFFLE STATE MANAGEMENT
// ============================================================================

export interface RaffleState {
    raffleId: string;
    tickets: Ticket[];
    isDrawn: boolean;
    drawResult: DrawResult | null;
}

/**
 * Process a raffle draw when time expires
 */
export function processRaffleDraw(raffle: RaffleDisplay, tickets: Ticket[]): DrawResult {
    // Perform the draw
    const result = drawWinner(raffle.id, tickets);

    return result;
}

/**
 * Validate if a raffle can be drawn
 */
export function canDrawRaffle(raffle: RaffleDisplay): boolean {
    const now = Date.now();
    const endTime = raffle.endTime.getTime();

    return (
        !raffle.isDrawn &&
        now >= endTime &&
        raffle.ticketsSold > 0
    );
}

// ============================================================================
// TICKET PURCHASE VALIDATION
// ============================================================================

/**
 * Check if a user can purchase tickets
 */
export function canPurchaseTickets(
    raffle: RaffleDisplay,
    quantity: number
): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const endTime = raffle.endTime.getTime();

    if (now >= endTime) {
        return { allowed: false, reason: "Raffle has ended" };
    }

    if (raffle.isDrawn) {
        return { allowed: false, reason: "Winner already drawn" };
    }

    const remainingTickets = raffle.maxTickets - raffle.ticketsSold;
    if (quantity > remainingTickets) {
        return {
            allowed: false,
            reason: `Only ${remainingTickets} tickets remaining`
        };
    }

    if (quantity <= 0) {
        return { allowed: false, reason: "Invalid ticket quantity" };
    }

    return { allowed: true };
}

/**
 * Calculate total cost for ticket purchase
 */
export function calculateTicketCost(
    raffle: RaffleDisplay,
    quantity: number
): number {
    if (raffle.isFree) {
        return 0;
    }
    return raffle.ticketPrice * quantity;
}

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

export interface PlatformStats {
    totalRaffles: number;
    totalPrizePool: number;
    totalParticipants: number;
    activeRaffles: number;
    completedRaffles: number;
    totalWinnersPaid: number;
}

/**
 * Calculate platform statistics
 */
export function calculatePlatformStats(raffles: RaffleDisplay[]): PlatformStats {
    const now = Date.now();

    return {
        totalRaffles: raffles.length,
        totalPrizePool: raffles.reduce((sum, r) => sum + r.prizeAmount, 0),
        totalParticipants: raffles.reduce((sum, r) => sum + r.participantCount, 0),
        activeRaffles: raffles.filter(r => r.endTime.getTime() > now).length,
        completedRaffles: raffles.filter(r => r.isDrawn).length,
        totalWinnersPaid: raffles.filter(r => r.isClaimed).length,
    };
}

// ============================================================================
// SIMULATION HELPERS (For UI Demo)
// ============================================================================

/**
 * Simulate a draw animation result
 * Used for the spinning wheel animation
 */
export function simulateDrawAnimation(
    raffleId: string,
    participantAddresses: string[],
    duration: number = 5000
): Promise<{ winner: string; winningIndex: number }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Apply platform probability
            const hasWinner = applyPlatformProbability();

            if (hasWinner && participantAddresses.length > 0) {
                const winnerIndex = Math.floor(Math.random() * participantAddresses.length);
                resolve({
                    winner: participantAddresses[winnerIndex],
                    winningIndex: winnerIndex,
                });
            } else {
                // No winner this round - pick a "close" result
                const almostWinnerIndex = Math.floor(Math.random() * participantAddresses.length);
                resolve({
                    winner: "", // Empty means no winner
                    winningIndex: almostWinnerIndex,
                });
            }
        }, duration);
    });
}

/**
 * Generate mock tickets for testing
 */
export function generateMockTickets(count: number, owners: string[]): Ticket[] {
    const tickets: Ticket[] = [];

    for (let i = 1; i <= count; i++) {
        tickets.push({
            ticketNumber: i,
            owner: owners[Math.floor(Math.random() * owners.length)],
            purchaseTime: Date.now() - Math.floor(Math.random() * 86400000),
        });
    }

    return tickets;
}
