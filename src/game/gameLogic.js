import { createDeck, shuffle } from "./deck";
import { PHASES } from "./gameState";
import { getWinners, HAND_CATEGORY } from "./handEvaluator";

// find the next action player
function findNextPlayerIndex(players, startIndex) {
  const n = players.length;
  if (n === 0) return 0;

  let idx = startIndex;
  for (let i = 1; i <= n; i++) {
    const idx = (startIndex + i) % n;
    const p = players[idx];
    if (!p.folded && !p.allIn && p.chips > 0) {
      return idx;
    }
  }
  return startIndex;
}

//draw from the top
function drawOne(deck){
    const [card, ...rest] = deck;
    return { card, deck:rest};
}

function addMessage(state,text) {
    return{
        ...state,
        messageLog: [...state.messageLog, text],
    };
}
/**
 * start new game
 */
export function startHand(state){
    const n = state.players.length;
    if (n === 0) return state;

    // 1. create and shuffle cards
    let deck = shuffle(createDeck());

    // 2. reset game state（chips not reset）
    const players = state.players.map((p) => ({
        ...p,
        cards: [],
        bet: 0,
        folded: false,
        allIn: false,
        hasActedThisRound: false,
    }));

    //3. give every player 2 cards
    for (let round = 0; round < 2; round++) {
        for (let i = 0; i < n; i++) {
            const { card, deck: newDeck } = drawOne(deck);
            deck = newDeck;
            players[i] = {
                ...players[i],
                cards: [...players[i].cards, card],
            };
        }
    }

    //4. counculate smallblind and bigblind
    const dealerIndex = state.dealerIndex ?? 0;
    const smallBlindIndex = (dealerIndex + 1) % n;
    const bigBlindIndex = (dealerIndex + 2) % n;

    let pot = 0;
    let currentBet = 0;

    // applyblind: blind into bet renew pot
    function applyblind(player,amount){
        const blindAmount = Math.min(player.chips, amount);
        const newChips = player.chips - blindAmount;
        const newBet = (player.bet || 0) + blindAmount;
        const allIn = newChips === 0;

        pot += blindAmount;
        currentBet = Math.max(currentBet, newBet);

        return{
            ...player,
            chips: newChips,
            bet: newBet,
            allIn,
        };
    }

    // small blind
    players[smallBlindIndex] = applyblind(players[smallBlindIndex], state.smallBlind);
    // big blind
    players[bigBlindIndex] = applyblind(players[bigBlindIndex],state.bigBlind)

    // 5. set the first action players
    const currentPlayerIndex = findNextPlayerIndex(players, bigBlindIndex);


    // 6. update static
    let newState = {
        ...state,
        phase: PHASES.PREFLOP,
        deck,
        communityCards: [],
        players,
        pot,
        currentBet,
        currentPlayerIndex,
        handFinished:false,
        lastWinners: [],
        lastWinningHand: null,
        lastWinningCards: [],
    };

    const dealerName = players[dealerIndex].name;
    const sbName = players[smallBlindIndex].name;
    const bbName = players[bigBlindIndex].name;

    newState = addMessage(
        newState,
        `new round. dealer: ${dealerName}, small blind:${sbName} (${state.smallBlind}), big blind:${bbName} (${state.bigBlind}).`
    );

    return newState;
}
/**
 * handle player actuon（fold / call / check / bet / raise / all-in）
 * @param {*} state
 * @param {{ playerIndex:number, kind:string, amount?:number }} payload
 */

export function handlePlayerAction(state, payload) {
  const { playerIndex, kind, amount = 0 } = payload;

  // 1. 只允许当前行动玩家操作，否则直接忽略
  if (playerIndex !== state.currentPlayerIndex) {
    console.warn("不是该玩家的行动回合");
    return state;
  }

  const players = [...state.players];
  let player = players[playerIndex];

  if (!player) return state;
  
  // 如果玩家已经弃牌或 all-in，就不该再行动
  if (player.folded || player.allIn) {
    console.warn("该玩家已弃牌或 all-in");
    return state;
  }

  // 从 state 拿出一些会被修改的字段
  let pot = state.pot;
  let currentBet = state.currentBet;

  // 当前玩家为了“跟到当前下注”还需要支付多少
  const toCall = Math.max(0, currentBet - (player.bet || 0));

  // 准备记录日志
  let logMsg = "";

  // 小工具：从玩家扣钱、加入底池
  function payFromPlayer(p, payAmount) {
    const realPay = Math.min(payAmount, p.chips); // 防止筹码不够
    if (realPay <= 0) return p;

    const newChips = p.chips - realPay;
    const newBet = (p.bet || 0) + realPay;
    pot += realPay;

    return {
      ...p,
      chips: newChips,
      bet: newBet,
      allIn: newChips === 0,
    };
  }

  // 2. 根据 kind 执行不同操作
  switch (kind) {
    case "fold": {
      // 弃牌：不动筹码，只标记 folded
      player = {
        ...player,
        folded: true,
      };
      logMsg = `${player.name} 弃牌`;
      break;
    }

    case "check": {
      // 过牌：只能在本轮自己已经跟到 currentBet（或当前没人下注）时才允许
      if (toCall > 0) {
        console.warn("当前有下注，不能 check，只能 call/raise");
        return state;
      }
      logMsg = `${player.name} 过牌`;
      break;
    }

    case "call": {
      if (toCall === 0) {
        // 没人下注时，call 等价于 check
        logMsg = `${player.name} 过牌`;
      } else {
        const beforeChips = player.chips;
        player = payFromPlayer(player, toCall);
        const paid = beforeChips - player.chips;
        logMsg = `${player.name} 跟注 ${paid}`;
      }
      break;
    }

    case "bet": {
      // 下注：只能在当前轮还没有任何下注（currentBet === 0）时进行
      if (currentBet > 0) {
        console.warn("已经有人下注，不能 bet，只能 raise");
        return state;
      }
      if (amount <= 0) {
        console.warn("无效下注金额");
        return state;
      }
      const beforeChips = player.chips;
      player = payFromPlayer(player, amount);
      const paid = beforeChips - player.chips;

      currentBet = player.bet; // 本轮被刷新为该玩家的下注额
      logMsg = `${player.name} 下注 ${paid}`;
      break;
    }

    case "raise": {
      // 加注：当前轮已有下注（currentBet > 0）时才能 raise
      if (currentBet === 0) {
        console.warn("当前没人下注，应该使用 bet 而不是 raise");
        return state;
      }
      if (amount <= 0) {
        console.warn("无效加注金额");
        return state;
      }

      // 理想情况下，加注后自己的 bet = currentBet + amount
      const targetBet = currentBet + amount;
      const needToPay = Math.max(0, targetBet - (player.bet || 0));

      const beforeChips = player.chips;
      player = payFromPlayer(player, needToPay);
      const paid = beforeChips - player.chips;

      // 实际的 bet 可能因为筹码不足而变成 all-in，这时 currentBet = player.bet
      currentBet = player.bet;
      logMsg = `${player.name} 加注到 ${player.bet}（本次支付 ${paid}）`;
      break;
    }

    case "all-in": {
      if (player.chips <= 0) {
        console.warn("该玩家已没有筹码");
        return state;
      }
      const beforeChips = player.chips;
      player = payFromPlayer(player, player.chips); // 把所有筹码都压上去
      const paid = beforeChips - player.chips;

      // all-in 可能是跟注、也可能是超过 currentBet 的加注
      currentBet = Math.max(currentBet, player.bet);
      logMsg = `${player.name} 全下 (${paid})`;
      break;
    }

    default:
      console.warn("未知操作 kind：", kind);
      return state;
  }

  // 3. 把修改后的 player 写回 players 数组
  player = {
    ...player,
    hasActedThisRound: true,   // 👈 这一轮已经轮到他行动了
  };
  players[playerIndex] = player;

  // 4. 找到下一个需要行动的玩家
  const nextPlayerIndex = findNextPlayerIndex(players, playerIndex);

  // 5. 构造新的 state
  let newState = {
    ...state,
    players,
    pot,
    currentBet,
    currentPlayerIndex: nextPlayerIndex,
  };

  // 6. 写入日志
  if (logMsg) {
    newState = addMessage(newState, logMsg);
  }

  // 7. 检查是否只剩一个未弃牌玩家：
  //    如果是，那这个玩家直接赢下整个底池（无需摊牌）
  const activePlayers = players.filter((p) => !p.folded);
  if (activePlayers.length === 1 && !newState.handFinished) {
    const winner = activePlayers[0];
    const winnerIdx = players.findIndex((p) => p.id === winner.id);
    const potAmount = newState.pot;

    // 把底池全部给这个玩家
    const updatedWinner = {
      ...players[winnerIdx],
      chips: players[winnerIdx].chips + potAmount,
    };
    const newPlayers = [...players];
    newPlayers[winnerIdx] = updatedWinner;

    newState = {
      ...newState,
      players: newPlayers,
      pot: 0,
      phase: PHASES.SHOWDOWN,
      handFinished: true,
    };

    newState = addMessage(
      newState,
      `${winner.name} 因所有对手弃牌直接获胜，赢得底池 ${potAmount}。`
    );
  }

  return newState;
}
/**
 * 
 * - preflop -> flop
 * - flop -> turn
 * - turn -> river
 * - river -> dhowdown
 */
export function goToNextPhase(state) {
    const { phase } = state;

    // 如果还没开始，或者已经摊牌了，就不再往后推进
    if (phase === PHASES.IDLE || phase === PHASES.SHOWDOWN) {
        return state;
    }

    // 如果当前是 river，下一步就是摊牌，不再发牌
    if (phase === PHASES.RIVER) {
        // 直接进入摊牌逻辑
        return doShowdown(state);
    }

    let deck = [...state.deck];
    let communityCards = [...state.communityCards];
    let players = state.players.map((p) => ({ ...p })); // 浅拷贝即可

    let newPhase = phase;
    let cardsToDeal = 0;

    // 根据当前阶段决定要发多少公共牌 & 下一个阶段
    if (phase === PHASES.PREFLOP) {
        // 发 flop：三张公共牌
        newPhase = PHASES.FLOP;
        cardsToDeal = 3;
    } else if (phase === PHASES.FLOP) {
        // 发 turn：一张公共牌
        newPhase = PHASES.TURN;
        cardsToDeal = 1;
    } else if (phase === PHASES.TURN) {
        // 发 river：一张公共牌
        newPhase = PHASES.RIVER;
        cardsToDeal = 1;
    }

    // 从牌堆顶发出 cardsToDeal 张公共牌
    for (let i = 0; i < cardsToDeal; i++) {
        const { card, deck: newDeck } = drawOne(deck);
        deck = newDeck;
        communityCards.push(card);
    }

    // 新一轮下注：把所有玩家本轮 bet 清零
    players = players.map((p) => ({
        ...p,
        bet: 0,
        hasActedThisRound: false,
    }));

    // 新一轮当前需要跟注的金额也清零
    const currentBet = 0;

    // 新一轮开始时，一般由庄家左边第一个未弃牌/未 all-in 的玩家先行动
    const currentPlayerIndex = findNextPlayerIndex(players, state.dealerIndex);

    // 组装新的 state
    let newState = {
        ...state,
        phase: newPhase,
        deck,
        communityCards,
        players,
        currentBet,
        currentPlayerIndex,
    };

    // 写一条日志
    if (newPhase === PHASES.FLOP) {
        newState = addMessage(
        newState,
        `进入 Flop 阶段，发出 3 张公共牌。`
        );
    } else if (newPhase === PHASES.TURN) {
        newState = addMessage(
        newState,
        `进入 Turn 阶段，发出第 4 张公共牌。`
        );
    } else if (newPhase === PHASES.RIVER) {
        newState = addMessage(
        newState,
        `进入 River 阶段，发出最后一张公共牌。`
        );
    }

    return newState;
}

/**
 * Showdown stage: Use handEvaluator to calculate the winner and distribute the chips.
 */
export function doShowdown(state) {
  // 如果已经摊牌过了，就不要重复结算
  if (state.phase === PHASES.SHOWDOWN || state.handFinished) {
    return state;
  }

  const players = [...state.players];
  const communityCards = state.communityCards;
  let pot = state.pot;

  // 只留未弃牌的玩家
  const activePlayers = players.filter((p) => !p.folded);

  // 如果底池为 0 或者没有有效玩家，直接结束
  if (pot <= 0 || activePlayers.length === 0) {
    return {
      ...state,
      phase: PHASES.SHOWDOWN,
      handFinished: true,
    };
  }

  // 使用 handEvaluator 中的 getWinners 找出所有赢家
  const { winners, bestResult } = getWinners(players, communityCards);

  if (!winners || winners.length === 0) {
    // 理论上不会出现，没有赢家就直接结束
    return {
      ...state,
      phase: PHASES.SHOWDOWN,
      handFinished: true,
    };
  }

  // 计算每个赢家应得的筹码（主池平分，余数给第一个赢家）
  const winnerCount = winners.length;
  const share = Math.floor(pot / winnerCount); // 每人基本分
  const remainder = pot % winnerCount;         // 余数

  const winnerIds = new Set(winners.map((w) => w.id));
  const firstWinnerId = winners[0].id;

  // 给玩家分配筹码
  const newPlayers = players.map((p) => {
    if (!winnerIds.has(p.id)) return p;

    const extra = p.id === firstWinnerId ? remainder : 0;
    return {
      ...p,
      chips: p.chips + share + extra,
    };
  });

  // 解析牌型名称（如 "Full House"）
  const rankKey = bestResult.rank ?? bestResult.category;
  const handName = HAND_CATEGORY[rankKey] || "Unknown Hand";

  const bestFive = bestResult.best5Cards || bestResult.cards || [];

  // 拼接赢家名字
  const winnerNames = winners.map((w) => w.name).join(", ");

  let logMsg;
  if (winners.length === 1) {
    logMsg = `${winnerNames} 以 ${handName} 获胜，赢得底池 ${pot} 筹码。`;
  } else {
    logMsg = `平局：${winnerNames} 以相同牌型 ${handName} 平分底池 ${pot} 筹码。`;
  }

  let newState = {
    ...state,
    players: newPlayers,
    pot: 0,                         // 底池清空
    phase: PHASES.SHOWDOWN,
    handFinished: true,
    // 方便 UI 使用的简单记录（可选）
    lastWinners: winners.map((w) => w.id),
    lastWinningHand: {
      rank: rankKey,
      name: handName,
    },
    lastWinningCards: bestFive,
  };

  newState = addMessage(newState, logMsg);

  return newState;
}

/**
 * start next game：
 * - add dealerindex（dealerIndex + 1）
 * - clear this round's cards, chips, pot 等
 * - phase return IDLE
 */
export function startNextHand(state) {
  const n = state.players.length;
  if (n === 0) return state;

  const nextDealer = (state.dealerIndex + 1) % n;

  const players = state.players.map((p) => ({
    ...p,
    bet: 0,
    folded: busted ? true : false,
    allIn: false,
    cards: [],
    hasActedThisRound: false,
    busted,
  }));

  return {
    ...state,
    phase: PHASES.IDLE,
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    players,
    dealerIndex: nextDealer,
    currentPlayerIndex: nextDealer,
    handFinished: false,
    lastWinners: [],
    lastWinningHand: null,
    lastWinningCards: [],
  };
}

// 判断这一轮下注是否已经结束
export function isBettingRoundComplete(state) {
  const { players, currentBet } = state;

  const active = players.filter(
    (p) => !p.folded && !p.allIn && p.chips > 0
  );

  // 只有一个或者零个有效玩家：有人 all-in 或者别人都弃牌了
  if (active.length <= 1) return true;

  // currentBet === 0：大家都没有下注，这一轮如果每个人都至少“check 过一次”，则结束
  if (currentBet === 0) {
    const allActed = active.every((p) => p.hasActedThisRound);
    return allActed;
  }

  // currentBet > 0：有人下注或加注过
  const allMatched = active.every((p) => {
    const acted = p.hasActedThisRound;
    const betMatched = (p.bet || 0) === currentBet || p.chips === 0;
    return acted && betMatched;
  });

  return allMatched;
}

