
// src/components/ActionPanel.jsx
import { isBettingRoundComplete } from "../game/gameLogic";


function ActionPanel({
  gameState,
  thinkingPlayerId,
  onStartHand,
  onNextPhase,
  onNextHand,
  onPlayerAction,
}) {
  const { phase, players, currentPlayerIndex, currentBet, handFinished } =
    gameState;

  const currentPlayer = players[currentPlayerIndex];
  const toCall = Math.max(0, currentBet - (currentPlayer?.bet || 0));
  const isHuman = currentPlayer?.isHuman;

  const canStartHand = phase === "idle" || handFinished;

   // betting ended or not
  const bettingComplete =
    !canStartHand && phase !== "showdown" && isBettingRoundComplete(gameState);

  // only if this round betting is done, go to the Next Phase 
  const canNextPhase = bettingComplete && phase !== "showdown";

  const isBotThinking =
    !isHuman && thinkingPlayerId === currentPlayer?.id;

  const handleFold = () => onPlayerAction("fold");
  const handleCheckOrCall = () => {
    if (toCall === 0) {
      onPlayerAction("check");
    } else {
      onPlayerAction("call");
    }
  };

  const handleBetSmall = () => {
    onPlayerAction(currentBet === 0 ? "bet" : "raise", 20);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {canStartHand ? (
        <button
          className="px-6 py-2 bg-yellow-300 border-2 border-yellow-500 rounded-md font-bold shadow hover:bg-yellow-400"
          onClick={onStartHand}
        >
          开始一局游戏
        </button>
      ) : (
        <>
          <div className="text-sm font-semibold mb-1">
            当前玩家: <span className="underline">{currentPlayer?.name}</span>{" "}
            ，需跟注: {toCall}
          </div>
          {isHuman ? (
            <div className="flex gap-3">
              <button
                onClick={handleFold}
                disabled={currentPlayer?.folded || bettingComplete}
                className="px-4 py-2 bg-yellow-300 border-2 border-yellow-500 rounded-md font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400"
              >
                弃牌
              </button>
              <button
                onClick={handleCheckOrCall}
                disabled={bettingComplete}
                className="px-4 py-2 bg-yellow-300 border-2 border-yellow-500 rounded-md font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400"
              >
                {toCall === 0 ? "过牌" : `跟注 ${toCall}`}
              </button>
              <button
                onClick={handleBetSmall}
                disabled={bettingComplete}
                className="px-4 py-2 bg-yellow-300 border-2 border-yellow-500 rounded-md font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400"
              >
                {currentBet === 0 ? "加注 20" : "再加 20"}
              </button>
            </div>
            ) : (
              <div className="text-sm text-yellow-200">
                {isBotThinking ? "AI 正在思考…" : "等待 AI 行动"}
              </div>
          )}

          <button
            onClick={onNextPhase}
            disabled={!canNextPhase}
            className="mt-2 px-4 py-1 bg-emerald-500 text-white text-sm rounded-md border border-emerald-700 shadow disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600"
          >
            Next Phase（发牌/摊牌）
          </button>

          {phase === "showdown" && (
            <button
              onClick={onNextHand}
              className="mt-1 px-4 py-1 bg-indigo-500 text-white text-sm rounded-md border border-indigo-700 shadow hover:bg-indigo-600"
            >
              下一局
            </button>
          )}

          {bettingComplete && phase !== "showdown" && (
            <div className="mt-1 text-xs text-white">
              本轮下注已结束，请点击 Next Phase。
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActionPanel;

