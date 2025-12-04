// src/game/botAI.js

/**
 * Bot 决策：
 * - 只看当前要跟注多少钱 toCall
 * - 没人下注时，有一定几率主动下注
 * - 要跟的钱太多，有概率弃牌
 *
 * return：
 *   { kind: "check" }
 *   { kind: "call" }
 *   { kind: "bet", amount: 20 }
 *   { kind: "raise", amount: 40 }
 *   { kind: "fold" }
 *
 * @param {Object} state present game state（read only）
 * @param {number} playerIndex 该 Bot 在 players 数组中的索引
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
    // preflop 稍微激进一点，flop/turn/river 稍微谨慎一点
    const betSize = bigBlind; // 下注/加注额度可以先固定为大盲

    if (rnd < 0.6) {
      // 60% 选择过牌
      return { kind: "check" };
    } else if (rnd < 0.9 && player.chips > betSize) {
      // 30% 主动下注
      return { kind: "bet", amount: betSize };
    } else {
      // 10% 偶尔小下注
      return { kind: "bet", amount: Math.max(10, Math.floor(betSize / 2)) };
    }
  }

  if (toCall === 0) {
    // 已经跟到当前注：合法动作是 check 或 raise

    const raiseSize = bigBlind;

    if (rnd < 0.7) {
      // 70% 选择 check
      return { kind: "check" };
    } else if (player.chips > raiseSize) {
      // 30% 选择加注
      return { kind: "raise", amount: raiseSize };
    } else {
      // 没钱加注，就老实 check
      return { kind: "check" };
    }
  }

  // 有人下注，需要决定跟注、弃牌还是加注
  const potPressure = toCall / Math.max(1, player.chips); // 要跟的钱占自己筹码的比例

  if (potPressure > 0.6) {
    // 要跟的钱太多（> 60% 筹码），更倾向弃牌或 all-in
    if (rnd < 0.7) {
      return { kind: "fold" };
    } else {
      // 偶尔 all-in 赌一把
      return { kind: "all-in" };
    }
  } else if (potPressure > 0.3) {
    // 压力中等：多半跟注，偶尔弃牌或小加注
    if (rnd < 0.1) return { kind: "fold" };
    if (rnd < 0.8) return { kind: "call" };
    return { kind: "raise", amount: bigBlind }; // 小加注
  } else {
    // 要跟的钱不多：大概率跟注，偶尔加注
    if (rnd < 0.05) return { kind: "fold" };
    if (rnd < 0.75) return { kind: "call" };
    return { kind: "raise", amount: bigBlind };
  }
}
