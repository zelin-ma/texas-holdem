# Texas Hold'em Web Game 🎮

A browser-based Texas Hold'em poker game built with **React + Vite + Tailwind CSS**.  
Features basic game flow, simple bot AI, hand evaluation, and animated chip betting.

---

## ✨ Features

- ♠ **Texas Hold'em rules**
  - Preflop → Flop → Turn → River → Showdown
  - Big blind / small blind, fold / check / call / bet / raise
- 🤖 **Bot AI**
  - 3 computer players with basic decision-making
  - Action delay + “thinking…” indicator
- 🃏 **Hand evaluator**
  - Detects all standard hand ranks: high card, pair, two pair, straight, flush, full house, four of a kind, straight flush, etc.
  - Compares hands to determine winners (supports ties / split pot)
- 💰 **Chip system + animations**
  - Players lose chips when betting, gain chips when winning
  - Floating `-20` / `+80` chip animations by seat position
- 🎨 **Poker table UI**
  - Player seats on four sides
  - Community cards in center, deck and pot info
  - Winner panel in top-right showing hand type and best 5 cards

---

## 🏁 Getting Started

### 1. Clone this repository

```bash
git clone https://github.com/zelin-ma/texas-holdem.git
cd texas-holdem
