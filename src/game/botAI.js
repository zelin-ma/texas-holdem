// src/game/botAI.js

/**
 * Bot's decision:
* - Only consider how much to call at the moment toCall
* - When no one bets, there is a certain probability of making the first bet
* - If the amount to call is too large, there is a probability of folding the hand
 *
 * return：
 *   { kind: "check" }
 *   { kind: "call" }
 *   { kind: "bet", amount: 20 }
 *   { kind: "raise", amount: 40 }
 *   { kind: "fold" }
 *
 * @param {Object} state present game state（read only）
 * @param {number} playerIndex 
 */
export function decideBotAction(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.folded || player.allIn || player.chips <= 0 || player.busted) {
    return null; // no action
  }

  const { currentBet, bigBlind, phase } = state;
  const toCall = Math.max(0, currentBet - (player.bet || 0));

  const rnd = Math.random();

  // no one calss
  if (currentBet === 0) {
    // In the pre-flop stage, be a little more aggressive. In the flop, turn and river stages, be a little more cautious.
    const betSize = bigBlind; // The bet/raise amount can be initially set as the big blind.

    if (rnd < 0.6) {
      // 60% check
      return { kind: "check" };
    } else if (rnd < 0.9 && player.chips > betSize) {
      // 30% bet
      return { kind: "bet", amount: betSize };
    } else {
      // 10% small bet
      return { kind: "bet", amount: Math.max(10, Math.floor(betSize / 2)) };
    }
  }

  if (toCall === 0) {

    const raiseSize = bigBlind;

    if (rnd < 0.7) {
      // 70% check
      return { kind: "check" };
    } else if (player.chips > raiseSize) {
      // 30% raise
      return { kind: "raise", amount: raiseSize };
    } else {
      // no chips，check
      return { kind: "check" };
    }
  }

  // Someone bet, need to decide whether to call, fold or raise.
  const potPressure = toCall / Math.max(1, player.chips); // The proportion of paid in relation to own stake

  if (potPressure > 0.6) {
    //  (> 60% of the bet), more advisable to fold or go all-in.
    if (rnd < 0.7) {
      return { kind: "fold" };
    } else {
      // Occasionally, all-in
      return { kind: "all-in" };
    }
  } else if (potPressure > 0.3) {
    // Moderate pressure: Mostly full-bets, occasionally folding or small raises
    if (rnd < 0.1) return { kind: "fold" };
    if (rnd < 0.8) return { kind: "call" };
    return { kind: "raise", amount: bigBlind }; // small raises
  } else {
    // bet is not large: mostly guaranteed bet, occasional additional bets.
    if (rnd < 0.05) return { kind: "fold" };
    if (rnd < 0.75) return { kind: "call" };
    return { kind: "raise", amount: bigBlind };
  }
}
