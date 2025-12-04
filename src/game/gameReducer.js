// src/game/gameReducer.js

import { PHASES } from "./gameState";
import { startHand, handlePlayerAction, goToNextPhase, doShowdown, startNextHand } from "./gameLogic";

export const ACTIONS = {
  START_HAND: "START_HAND",
  PLAYER_ACTION: "PLAYER_ACTION",
  NEXT_PHASE: "NEXT_PHASE",
  DO_SHOWDOWN: "DO_SHOWDOWN",
  START_NEXT_HAND: "START_NEXT_HAND",
  ADD_MESSAGE: "ADD_MESSAGE",
};

export function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_HAND:
      return startHand(state);

    case ACTIONS.PLAYER_ACTION:
      return handlePlayerAction(state, action.payload);

    case ACTIONS.NEXT_PHASE:
      return goToNextPhase(state);

    case ACTIONS.DO_SHOWDOWN:
      return doShowdown(state);

    case ACTIONS.START_NEXT_HAND:
      return startNextHand(state);

    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messageLog: [...state.messageLog, action.payload],
      };

    default:
      return state;
  }
}
