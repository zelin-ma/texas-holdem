# Texas Hold'em Web Game 🎮

A browser-based Texas Hold'em poker game built with **React + Vite + Tailwind CSS**.  
Features basic game flow, simple bot AI, hand evaluation, and animated chip betting.

---

## ✨ Features

- ♠ **Texas Hold'em rules**
  - Complete game flow: Preflop → Flop → Turn → River → Showdown
  - Automated deck shuffling & dealing
  - Player actions: Fold / Check / Call / Bet / Raise
  - Betting round completion detection
  - Pot accumulation & distribution
  - Correct multi-winner / tie (split pot) handling
- 🤖 **Bot AI**
  - 3 computer players with basic decision-making
  - Action delay + “thinking…” indicator
  - AI considers:
  - Current bet / pot pressure
  - Required call amount
  - Risk decisions (fold / call / raise / all-in)
  - Busted (0 chips) bots are automatically removed from the game
- 🃏 **Hand evaluator**
  - Detects all standard hand ranks: high card, pair, two pair, straight, flush, full house, four of a kind, straight flush, etc.
  - Compares hands to determine winners (supports ties / split pot)
- 💰 **Chip system + animations**
  - Players lose chips when betting, gain chips when winning
  - Floating `-20` / `+20` chip animations by seat position
- 🎨 **Table UI**
  - Player seats on four sides
  - Community cards in center, deck and pot info
  - Winner panel in top-right showing hand type and best 5 cards
  - Action log (autoscroll to latest entry)
  - Action panel

---

## 🏁 Getting Started

### 1. Clone this repository

```bash
git clone https://github.com/zelin-ma/texas-holdem.git
cd texas-holdem
```
### 2. Install dependencies

```bash
Install dependencies
```
### 3. Run the development server

```bash
npm run dev
```

## 🧱 Project Structure

```bash
src/
  App.jsx                   # Root component / AI loop controller
  index.css                 # Tailwind entry
  main.jsx                  # React bootstrap

  game/
    gameState.js            # Initial state, players, constants
    gameReducer.js          # All game state transitions
    gameLogic.js            # Dealing, betting, next phase, showdown
    handEvaluator.js        # Hand ranking & comparison logic
    botAI.js                # Bot decision-making system

  components/
    Table.jsx               # Poker table layout
    PlayerSeat.jsx          # Cards, chips, chip animation, status icons
    CommunityCards.jsx      # Flop / turn / river cards
    PotInfo.jsx             # Pot & phase display
    ActionPanel.jsx         # Player action buttons
    MessageLog.jsx          # Scroll-locked action log
    WinningHandInfo.jsx     # Winner panel (hand type + best 5 cards)
```

## 🔄 Game Flow Overview
- **▶ Start of Hand**
 - Dealer rotates
 - Blinds are posted
 - Each active player receives 2 cards
- **▶ Betting Rounds**
 - Player acts → Bots act with delay
 - Valid action transitions:
 - fold → next player
 - check → next player
 - call → next player
 - bet / raise → reset hasActedThisRound flags
 - When isBettingRoundComplete returns true → enable Next Phase
- **▶ Dealing Community Cards**
 - Flop (3 cards)
 - Turn (1 card)
 - River (1 card)
- **▶ Showdown**
 - Bots reveal cards
 - Best 5-card hand determined
 - Winner(s) awarded pot
 - Winner panel appears in top-right showing:
 - Winner names
 - Hand type (e.g. Full House)
 - 5-card winning combination

