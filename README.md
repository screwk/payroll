# PAYROLL | Solana Raffle Platform

> **"Get Paid. Win Big."** — A decentralized raffle platform on Solana with a premium, motion-heavy UI.

---

## 🚀 Overview

PAYROLL offers fair, transparent, on-chain raffles where users can win SOL prizes. The platform features an immersive UI with smooth animations, interactive particles, and a distinct orange/gold light theme.

### Key Features
- **Immersive Animated Background**: Multi-layered canvas particles, floating shapes, and SVG gradient meshes.
- **CardNav Navigation**: Expandable card-based menu with GSAP animations.
- **On-Chain Fairness**: Anchor smart contracts for ticket purchases and winner selection.
- **Full Responsiveness**: Optimized for both desktop and mobile.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | TailwindCSS v4 + Vanilla CSS |
| Animations | GSAP, Canvas API |
| Blockchain | Solana, Anchor Framework |
| Wallet | Solana Wallet Adapter |
| Language | TypeScript, Rust |

---

## 📁 Project Structure

```
payroll/
├── app/                        # Next.js frontend
│   └── src/
│       ├── app/                # Pages (App Router)
│       │   ├── page.tsx        # Homepage
│       │   ├── raffle/[id]/    # Raffle detail page
│       │   ├── my-tickets/     # User tickets page
│       │   ├── winners/        # Winners page
│       │   └── admin/          # Admin dashboard
│       ├── components/         # 19 React components
│       ├── lib/
│       │   └── raffleEngine.ts # Business logic
│       └── providers/          # Wallet context
├── programs/payroll/           # Anchor smart contracts
│   └── src/
│       ├── lib.rs              # Main program
│       ├── state.rs            # Account structures
│       ├── security.rs         # Security guards
│       ├── admin.rs            # Admin controls
│       ├── errors.rs           # Error codes
│       └── constants.rs        # Limits & seeds
└── tests/
    └── payroll.ts              # Anchor test suite
```

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- Rust & Cargo
- Solana CLI
- Anchor CLI

### Frontend Setup

```bash
git clone https://github.com/yourusername/payroll.git
cd payroll
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Smart Contract Setup

```bash
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

---

## ✅ What's Already Implemented

### Frontend (UI Complete, No On-Chain Connection)

| Component | Status | Details |
|-----------|--------|---------|
| Homepage | ✅ UI Done | Hero, stats, raffle cards — uses `MOCK_RAFFLES` array |
| Raffle Detail | ✅ UI Done | Prize display, countdown, wheel, participants — uses `MOCK_PARTICIPANTS` |
| My Tickets | ✅ UI Done | Empty state only — no wallet data fetching |
| Winners | ✅ UI Done | Static list — uses `MOCK_WINNERS` array |
| Admin Panel | ✅ UI Done | Form exists — `handleSubmit` is a `console.log` + `setTimeout` |
| Animated Background | ✅ Working | ParticleField, FloatingShapes, GradientMesh |
| Wallet Connection | ✅ Working | Phantom, Solflare, Torus, Ledger adapters configured |
| Ticket Purchase | ✅ UI Done | Quantity selector, cost display — **no real transaction** |

### Smart Contracts (Complete, Not Deployed)

| Module | Status | Details |
|--------|--------|---------|
| `lib.rs` | ✅ Written | All instructions: initialize, create_raffle, buy_ticket, draw_winner, claim_prize |
| `security.rs` | ✅ Written | Reentrancy guards, rate limiting, blacklist, safe math |
| `state.rs` | ✅ Written | Platform, Raffle, Ticket, UserStats, BlacklistEntry accounts |
| `admin.rs` | ✅ Written | 2-step admin transfer, pause/unpause, fee management |
| `errors.rs` | ✅ Written | 50+ custom error codes |
| `constants.rs` | ✅ Written | All limits and PDA seeds |

### Tests

| Test | Status | Details |
|------|--------|---------|
| Platform Init | ✅ Written | Tests initialization and security config |
| Pause/Unpause | ✅ Written | Tests admin emergency controls |
| Admin Transfer | ✅ Written | Tests 24h timelock enforcement |
| Raffle Creation | ✅ Written | Tests parameter validation |
| Fee Management | ✅ Written | Tests fee update and max limits |

### Engine Logic

| Feature | Status | Details |
|---------|--------|---------|
| `raffleEngine.ts` | ✅ Written | Hidden 3% win probability, multi-pass randomness, prize sorting |

---

## ⚠️ What's NOT Implemented Yet (Missing Work)

### 🔴 Critical: Frontend-to-Chain Integration

1. **No Program Connection**
   - `TicketPurchase.tsx` line 31-32: `onPurchase()` is passed from parent but **never calls Anchor program**
   - Raffle detail page line 121-127: `handlePurchase()` just updates local state with `setTimeout`
   - **Fix needed**: Create `usePayroll` hook to call `program.methods.buyTicket()`

2. **All Data is Mock**
   - Homepage `MOCK_RAFFLES` (lines 15-84): Hardcoded 4 raffles
   - Raffle detail `MOCK_RAFFLES` (lines 21-90): Duplicate mock data
   - Raffle detail `MOCK_PARTICIPANTS` (lines 11-18): Static 6 participants
   - Winners page `MOCK_WINNERS` (lines 6-10): Static 3 winners
   - **Fix needed**: Fetch real data from deployed program via `program.account.raffle.all()`

3. **Admin Panel Not Functional**
   - `admin/page.tsx` line 9: `ADMIN_WALLET = "YOUR_ADMIN_WALLET_ADDRESS_HERE"` (placeholder)
   - `admin/page.tsx` line 30: `console.log("Creating raffle with:", formData)` (no TX)
   - **Fix needed**: Call `program.methods.createRaffle()` with actual parameters

4. **My Tickets Empty**
   - `my-tickets/page.tsx`: Shows only empty state UI, no logic to fetch user's tickets
   - **Fix needed**: Query `program.account.ticket.all()` filtered by connected wallet

### 🟡 Program Deployment

1. **Program Not Deployed**
   - `lib.rs` line 23: `declare_id!("PayRo11111111111111111111111111111111111111")` (placeholder ID)
   - **Fix needed**: Run `anchor deploy` and update program ID

2. **No IDL in Frontend**
   - No `target/types/payroll.ts` copied to frontend
   - **Fix needed**: Copy IDL after build, create program instance

### 🟡 Missing Features

| Feature | File | Issue |
|---------|------|-------|
| Draw Winner Button | `raffle/[id]/page.tsx` | Calls local `handleDrawWinner()` not program |
| Claim Prize | Not implemented | No UI or function for winner to claim |
| Cancel Raffle | Not implemented | Admin can't cancel/refund |
| VRF Randomness | `lib.rs` | Uses fallback `generate_secure_random()`, not Switchboard VRF |
| Blacklist Check | `lib.rs` | Code exists but not connected in `buy_ticket` |
| Transaction Status | UI | No pending/success/error toast notifications |
| Prize Claim Flow | UI | No claim button or winner notification |

### 🟡 Security Gaps

1. **No Rate Limit Testing in Frontend**
   - Backend has rate limiting, frontend shows no rate limit errors

2. **No Slippage Protection UI**
   - No display of network fees or confirmation dialogs

3. **No Transaction History**
   - User can't see past purchases

---

## 🗺️ Implementation Roadmap

### Phase 1: Connect Frontend to Program (Priority: HIGH)

```
[ ] Deploy program to Devnet
[ ] Copy IDL to frontend: app/src/idl/payroll.json
[ ] Create usePayroll hook with all program methods
[ ] Replace MOCK_RAFFLES with program.account.raffle.all()
[ ] Implement real buyTicket() transaction
[ ] Implement real createRaffle() in admin panel
[ ] Fetch user tickets for My Tickets page
[ ] Fetch actual winners from program
```

### Phase 2: Complete User Flows (Priority: HIGH)

```
[ ] Add claim prize button and flow for winners
[ ] Transaction status notifications (toast)
[ ] Loading states during transactions
[ ] Error handling with user-friendly messages
[ ] Wallet balance check before purchase
```

### Phase 3: Admin Features (Priority: MEDIUM)

```
[ ] Set actual ADMIN_WALLET address
[ ] Implement pause/unpause controls
[ ] Add raffle management (list, pause, cancel)
[ ] Implement withdraw proceeds
[ ] Admin transfer UI
```

### Phase 4: Security & VRF (Priority: MEDIUM)

```
[ ] Integrate Switchboard VRF for verifiable randomness
[ ] Enable blacklist check in buy_ticket
[ ] Add rate limit error displays
[ ] Security audit before mainnet
```

### Phase 5: Polish (Priority: LOW)

```
[ ] Transaction history page
[ ] Push notifications for winners
[ ] Mobile PWA support
[ ] Analytics dashboard
```

---

## 🔒 Security Features (Implemented in Contracts)

- **Reentrancy guards** (`is_claiming` flag)
- **Rate limiting** (5 tickets/minute)
- **Blacklist system** (infrastructure ready)
- **2-step admin transfer** (24h timelock)
- **Input validation** (min/max amounts)
- **Safe math** (overflow protection)

---

## 🧪 Testing

```bash
# Run Anchor tests
anchor test

# Frontend dev server
cd app && npm run dev
```

---

## 📄 Environment Variables

Create `.env.local` in `/app`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=<your-deployed-program-id>
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#ff7a00` (Orange) |
| Secondary | `#f59e0b` (Gold) |
| Background | White `#ffffff` |
| Surface | `#fefcf3` (Cream) |

---

Built with ❤️ on Solana.
< ! - -   r e d e p l o y   t r i g g e r :   u p d a t e   e n v   k e y s   - - >  
 