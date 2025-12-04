// src/App.jsx
import { useReducer, useState,useEffect} from "react";
import { createInitialGameState, PHASES} from "./game/gameState";
import { gameReducer, ACTIONS } from "./game/gameReducer";
import { decideBotAction } from "./game/botAI";
import { isBettingRoundComplete } from "./game/gameLogic";
import Table from "./components/Table";

function App() {
  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    createInitialGameState
  );

  const [thinkingPlayerId, setThinkingPlayerId] = useState(null);

  const handleStartHand = () => {
    dispatch({ type: ACTIONS.START_HAND });
  };

  const handleNextPhase = () => {
    dispatch({ type: ACTIONS.NEXT_PHASE });
  };

  const handleNextHand = () => {
    dispatch({ type: ACTIONS.START_NEXT_HAND });
  };

  const handlePlayerAction = (kind, amount) => {
    dispatch({
      type: ACTIONS.PLAYER_ACTION,
      payload: {
        playerIndex: state.currentPlayerIndex,
        kind,
        amount,
      },
    });
  };

  // AI turn action
  useEffect(() => {
    const { phase, players, currentPlayerIndex, handFinished } = state;
    
    if (!players || players.length === 0) {
      setThinkingPlayerId(null);
      return;
    }
    const current = players[currentPlayerIndex];

    const bettingComplete = isBettingRoundComplete(state);

    // AI will not react in not gamephase 
    const inPlayingPhase =
      phase !== PHASES.IDLE && phase !== PHASES.SHOWDOWN && !handFinished && !bettingComplete;;

    const isBotTurn =
      inPlayingPhase && current && !current.isHuman && !current.folded && !current.allIn && !current.busted && current.chips > 0;

    if (!isBotTurn) {
      setThinkingPlayerId(null);
      return;
    }

    // thinking
    setThinkingPlayerId(current.id);

    // delay 0.8 ~ 2 second
    const delay = 800 + Math.random() * 1200;

    const timer = setTimeout(() => {
      const action = decideBotAction(state, currentPlayerIndex);
      if (!action) {
        setThinkingPlayerId(null);
        return;
      }

      dispatch({
        type: ACTIONS.PLAYER_ACTION,
        payload: {
          playerIndex: currentPlayerIndex,
          kind: action.kind,
          amount: action.amount,
        },
      });

      setThinkingPlayerId(null);
    }, delay);

    // clear timer
    return () => clearTimeout(timer);
  }, [state]);


  return (
    <div className="App">
      <Table
        gameState={state}
        thinkingPlayerId={thinkingPlayerId}
        onStartHand={handleStartHand}
        onNextPhase={handleNextPhase}
        onNextHand={handleNextHand}
        onPlayerAction={handlePlayerAction}
      />
    </div>
  );
}

export default App;
