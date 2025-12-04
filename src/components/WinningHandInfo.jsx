// src/components/WinningHandInfo.jsx
function WinningHandInfo({
  phase,
  players,
  lastWinners,
  lastWinningHand,
  lastWinningCards,
}) {
  //don't display if there is not result
  if (!lastWinningHand || !lastWinners || lastWinners.length === 0) return null;
  if (phase !== "showdown") return null;

  const winnerNames = lastWinners
    .map((id) => players.find((p) => p.id === id)?.name ?? "未知玩家")
    .join(", ");

  const isTie = lastWinners.length > 1;

  return (
    <div className="bg-black/70 text-white text-xs md:text-sm rounded-md px-3 py-2 shadow-lg space-y-1">
      <div className="font-semibold text-sm">本局结果</div>
      <div>
        {isTie ? "平局获胜者：" : "获胜者："}
        <span className="font-semibold">{winnerNames}</span>
      </div>
      <div>
        牌型：
        <span className="font-semibold">{lastWinningHand.name}</span>
      </div>

      {/* display the winners cards*/}
      {Array.isArray(lastWinningCards) && lastWinningCards.length > 0 && (
        <div className="mt-1 flex gap-1">
          {lastWinningCards.map((c, idx) => {
            const isRed = c.suit === "♥" || c.suit === "♦";
            return (
              <div
                key={idx}
                className={
                  "w-10 h-16 bg-sky-500 border border-black rounded-md flex items-center justify-center text-base font-bold shadow " +
                  (isRed ? "text-red-500" : "text-black")
                }
              >
                {c.rank}
                {c.suit}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WinningHandInfo;

