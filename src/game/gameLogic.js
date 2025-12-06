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

  // 1. only let current player action allowed
  if (playerIndex !== state.currentPlayerIndex) {
    console.warn("Not this player turn");
    return state;
  }

  const players = [...state.players];
  let player = players[playerIndex];

  if (!player) return state;
  
  // if player fold or all-in, no more action
  if (player.folded || player.allIn) {
    console.warn("this player is folded or all-in");
    return state;
  }

  let pot = state.pot;
  let currentBet = state.currentBet;

  // How much does the current player need to pay in order to "continue betting at the current level"
  const toCall = Math.max(0, currentBet - (player.bet || 0));

  // message logs
  let logMsg = "";

  // depositing players chips and joining the pot
  function payFromPlayer(p, payAmount) {
    const realPay = Math.min(payAmount, p.chips); // Prevent insufficient chips
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

  // 2. Perform different operations based on the value of "kind"
  switch (kind) {
    case "fold": {
      // fold
      player = {
        ...player,
        folded: true,
      };
      logMsg = `${player.name} fold`;
      break;
    }

    case "check": {
      // check
      if (toCall > 0) {
        console.warn("there was bet this round, can't check, only can call/raise");
        return state;
      }
      logMsg = `${player.name} check`;
      break;
    }

    case "call": {
      if (toCall === 0) {
        // call: equal to check if nobody bet
        logMsg = `${player.name} check`;
      } else {
        const beforeChips = player.chips;
        player = payFromPlayer(player, toCall);
        const paid = beforeChips - player.chips;
        logMsg = `${player.name} call ${paid}`;
      }
      break;
    }

    case "bet": {
      // bet
      if (currentBet > 0) {
        console.warn("there was bet this round, can't check, only can raise");
        return state;
      }
      if (amount <= 0) {
        console.warn("unable bet amount");
        return state;
      }
      const beforeChips = player.chips;
      player = payFromPlayer(player, amount);
      const paid = beforeChips - player.chips;

      currentBet = player.bet; 
      logMsg = `${player.name} bet ${paid}`;
      break;
    }

    case "raise": {
      // raise： raise only when there is already an bet (currentBet > 0)
      if (currentBet === 0) {
        console.warn("nobody bet,use bet not raise");
        return state;
      }
      if (amount <= 0) {
        console.warn("unable raise amount");
        return state;
      }

      //bet = currentBet + amount
      const targetBet = currentBet + amount;
      const needToPay = Math.max(0, targetBet - (player.bet || 0));

      const beforeChips = player.chips;
      player = payFromPlayer(player, needToPay);
      const paid = beforeChips - player.chips;

      //insufficient chips: bet = all-in
      currentBet = player.bet;
      logMsg = `${player.name} raise to ${player.bet}（chips amount ${paid}）`;
      break;
    }

    case "all-in": {
      if (player.chips <= 0) {
        console.warn("this player has no chips");
        return state;
      }
      const beforeChips = player.chips;
      player = payFromPlayer(player, player.chips); // Put all your chips on the table
      const paid = beforeChips - player.chips;

      //"All-in" could either be a call or an increase in bet amount exceeding the "currentBet"
      currentBet = Math.max(currentBet, player.bet);
      logMsg = `${player.name} all-in (${paid})`;
      break;
    }

    default:
      console.warn("unknown action kind：", kind);
      return state;
  }

  // 3. Put the modified player back into the players array
  player = {
    ...player,
    hasActedThisRound: true, 
  };
  players[playerIndex] = player;

  // 4. find next player
  const nextPlayerIndex = findNextPlayerIndex(players, playerIndex);

  // 5.renew state
  let newState = {
    ...state,
    players,
    pot,
    currentBet,
    currentPlayerIndex: nextPlayerIndex,
  };

  // 6. write in message log
  if (logMsg) {
    newState = addMessage(newState, logMsg);
  }

  // 7. Check if there is only one player left who is not folded:
  //    If so, that player won
  const activePlayers = players.filter((p) => !p.folded);
  if (activePlayers.length === 1 && !newState.handFinished) {
    const winner = activePlayers[0];
    const winnerIdx = players.findIndex((p) => p.id === winner.id);
    const potAmount = newState.pot;

    // entire pot to this player
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
      `${winner.name} win the game because all opponents folded, won chips in pot ${potAmount}。`
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

    // If it hasn't started yet, or if it's already showdown, stop moving forward.
    if (phase === PHASES.IDLE || phase === PHASES.SHOWDOWN) {
        return state;
    }

    //if river，next phase is showdown
    if (phase === PHASES.RIVER) {
        return doShowdown(state);
    }

    let deck = [...state.deck];
    let communityCards = [...state.communityCards];
    let players = state.players.map((p) => ({ ...p })); 

    let newPhase = phase;
    let cardsToDeal = 0;

    // how many community cards in each phase
    if (phase === PHASES.PREFLOP) {
        // 发 flop：3 cards
        newPhase = PHASES.FLOP;
        cardsToDeal = 3;
    } else if (phase === PHASES.FLOP) {
        // 发 turn：1 cards
        newPhase = PHASES.TURN;
        cardsToDeal = 1;
    } else if (phase === PHASES.TURN) {
        // 发 river：1 cards
        newPhase = PHASES.RIVER;
        cardsToDeal = 1;
    }

    // Dealing out cardsToDeal number of cards from the top of the deck
    for (let i = 0; i < cardsToDeal; i++) {
        const { card, deck: newDeck } = drawOne(deck);
        deck = newDeck;
        communityCards.push(card);
    }

    // new round bet：clear bet amount
    players = players.map((p) => ({
        ...p,
        bet: 0,
        hasActedThisRound: false,
    }));

    const currentBet = 0;

    // At the beginning of a new round, the player on the left of the dealer who has not folded or "all-in" is usually the first to act.
    const currentPlayerIndex = findNextPlayerIndex(players, state.dealerIndex);

    // new state
    let newState = {
        ...state,
        phase: newPhase,
        deck,
        communityCards,
        players,
        currentBet,
        currentPlayerIndex,
    };

    // messagelog
    if (newPhase === PHASES.FLOP) {
        newState = addMessage(
        newState,
        `Flop phase, 3 community cards`
        );
    } else if (newPhase === PHASES.TURN) {
        newState = addMessage(
        newState,
        `Turn phase, 4 community cards`
        );
    } else if (newPhase === PHASES.RIVER) {
        newState = addMessage(
        newState,
        `River phase, 5 community cards`
        );
    }

    return newState;
}

/**
 * Showdown stage: Use handEvaluator to calculate the winner and distribute the chips.
 */
export function doShowdown(state) {
  // if already showdown, no need to settlement again
  if (state.phase === PHASES.SHOWDOWN || state.handFinished) {
    return state;
  }

  const players = [...state.players];
  const communityCards = state.communityCards;
  let pot = state.pot;

  // only left the players unfolded
  const activePlayers = players.filter((p) => !p.folded);

  // If the pot is zero or there are no valid players, immediately end the game.
  if (pot <= 0 || activePlayers.length === 0) {
    return {
      ...state,
      phase: PHASES.SHOWDOWN,
      handFinished: true,
    };
  }

  // use getWinners in handEvaluator to find winner
  const { winners, bestResult } = getWinners(players, communityCards);

  if (!winners || winners.length === 0) {
    return {
      ...state,
      phase: PHASES.SHOWDOWN,
      handFinished: true,
    };
  }

  // Calculate the chips that each winner is entitled to
  const winnerCount = winners.length;
  const share = Math.floor(pot / winnerCount); 
  const remainder = pot % winnerCount;         

  const winnerIds = new Set(winners.map((w) => w.id));
  const firstWinnerId = winners[0].id;

  // Distribute chips to the players
  const newPlayers = players.map((p) => {
    if (!winnerIds.has(p.id)) return p;

    const extra = p.id === firstWinnerId ? remainder : 0;
    return {
      ...p,
      chips: p.chips + share + extra,
    };
  });

  // Parse the name of the card hand
  const rankKey = bestResult.rank ?? bestResult.category;
  const handName = HAND_CATEGORY[rankKey] || "Unknown Hand";

  const bestFive = bestResult.best5Cards || bestResult.cards || [];

  // names of the winners
  const winnerNames = winners.map((w) => w.name).join(", ");

  let logMsg;
  if (winners.length === 1) {
    logMsg = `${winnerNames} win the game with ${handName},win ${pot} chips.`;
  } else {
    logMsg = `tie:${winnerNames} same cards ${handName}, Split ${pot} chips.`;
  }

  let newState = {
    ...state,
    players: newPlayers,
    pot: 0,                         // clear pot
    phase: PHASES.SHOWDOWN,
    handFinished: true,
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

// Determine whether this round of betting has ended
export function isBettingRoundComplete(state) {
  const { players, currentBet } = state;

  const active = players.filter(
    (p) => !p.folded && !p.allIn && p.chips > 0
  );

  // There is either one or zero valid players: someone has all-in or everyone else has folded.
  if (active.length <= 1) return true;

  // If currentBet is 0: No one has placed a bet. If each player has "checked" at least once in this round, then the round is over.
  if (currentBet === 0) {
    const allActed = active.every((p) => p.hasActedThisRound);
    return allActed;
  }

  // currentBet > 0: Someone has placed a bet or increased their stake.
  const allMatched = active.every((p) => {
    const acted = p.hasActedThisRound;
    const betMatched = (p.bet || 0) === currentBet || p.chips === 0;
    return acted && betMatched;
  });

  return allMatched;
}

