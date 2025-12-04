export const PHASES = {
    IDLE: "idle",       //game unstart
    PREFLOP: "preflop", //after dealt hole cards, start pot 1
    FLOP: "flop",       //flop round(3 community cards)
    TURN: "turn",       //turn round(4 community cards)
    RIVER: "river",     //river round(5 community cards)
    SHOWDOWN: "showdown",   //showdown cards
};

//create player list
//death data 1 player + 3 bots
export function createInitialPlayers(){
    return[
    {
      id: 0,
      name: "You",
      isHuman: true,
      chips: 1000,   // players standered chips
      bet: 0,        // this round bets
      folded: false, // folded or not
      allIn: false,  // all-in or not
      cards: [],     // hand cards
      hasActedThisRound: false,
      busted: false, 
    },
    {
      id: 1,
      name: "Bot 1",
      isHuman: false,
      chips: 1000,
      bet: 0,
      folded: false,
      allIn: false,
      cards: [],
      hasActedThisRound: false,
      busted: false, 
    },
    {
      id: 2,
      name: "Bot 2",
      isHuman: false,
      chips: 1000,
      bet: 0,
      folded: false,
      allIn: false,
      cards: [],
      hasActedThisRound: false,
      busted: false, 
    },
    {
      id: 3,
      name: "Bot 3",
      isHuman: false,
      chips: 1000,
      bet: 0,
      folded: false,
      allIn: false,
      cards: [],
      hasActedThisRound: false,
      busted: false, 
    },
    ];
}

// create initial gamestate
export function createInitialGameState(){
    const players = createInitialPlayers();

    return{
        phase: PHASES.IDLE,

        deck: [],
        communityCards: [],

        players,

        pot: 0,
        currentBet: 0,

        dealerIndex: 0,
        currentPlayerIndex: 0,

        smallBlind: 10,
        bigBlind: 20,

        messageLog: [],
        handFinished: false,     
    };
}