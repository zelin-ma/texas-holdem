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
