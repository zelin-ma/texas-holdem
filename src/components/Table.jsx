// src/components/Table.jsx
import PlayerSeat from "./PlayerSeat";
import CommunityCards from "./CommunityCards";
import PotInfo from "./PotInfo";
import ActionPanel from "./ActionPanel";
import MessageLog from "./MessageLog";
import WinningHandInfo from "./WinningHandInfo";

function Table({
  gameState,
  thinkingPlayerId,
  onStartHand,
  onNextPhase,
  onNextHand,
  onPlayerAction,
}) {
  const {
    players,
    communityCards,
    pot,
    phase,
    currentPlayerIndex,
    messageLog,
    currentBet,
    handFinished,
    lastWinners,
    lastWinningHand,
    lastWinningCards,
  } = gameState;
const currentPlayer = players[currentPlayerIndex];
  

  // 0 = human player，1 = left-Bot，2 = top-Bot，3 = right-Bot
  const me = players[0];
  const botLeft = players[1];
  const botTop = players[2];
  const botRight = players[3];

  const isShowdown = phase === "showdown";

  return (
    <div className="relative w-full h-screen bg-emerald-600 overflow-hidden text-black">

      {/* right-top：winner */}
      <div className="absolute top-4 right-4">
        <WinningHandInfo
          phase={phase}
          players={players}
          lastWinners={lastWinners}
          lastWinningHand={lastWinningHand}
          lastWinningCards={lastWinningCards} 
        />
      </div>

      {/* left player */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2">
        {botLeft && (
          <PlayerSeat
            player={botLeft}
            isCurrent={currentPlayerIndex === 1}
            isThinking={thinkingPlayerId === botLeft.id}
            position="left"
            showCards={isShowdown || botLeft.folded || botLeft.busted}
          />
        )}
      </div>

      {/* top player*/}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        {botTop && (
          <PlayerSeat
            player={botTop}
            isCurrent={currentPlayerIndex === 2}
            isThinking={thinkingPlayerId === botTop.id}
            position="top"
            showCards={isShowdown || botLeft.folded || botLeft.busted}
          />
        )}
      </div>

      {/* right player */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        {botRight && (
          <PlayerSeat
            player={botRight}
            isCurrent={currentPlayerIndex === 3}
            isThinking={thinkingPlayerId === botRight.id}
            position="right"
            showCards={isShowdown || botLeft.folded || botLeft.busted}
          />
        )}
      </div>

      {/* center：deck + community cards + pot */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        {/* deck */}
        <div className="w-24 h-16 bg-black rounded-md shadow-lg" />

        <CommunityCards cards={communityCards} />

        <PotInfo pot={pot} phase={phase} />
      </div>

      {/* my seat：bottom */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
        {me && (
          <PlayerSeat
            player={me}
            isCurrent={currentPlayerIndex === 0}
            isThinking={thinkingPlayerId === me.id}
            position="bottom"
            showCards={true}
          />
        )}
      </div>

      {/* action panel*/}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <ActionPanel
          gameState={gameState}
          thinkingPlayerId={thinkingPlayerId}
          onStartHand={onStartHand}
          onNextPhase={onNextPhase}
          onNextHand={onNextHand}
          onPlayerAction={onPlayerAction}
        />
      </div>

      {/* messagelog*/}
     <div className="absolute right-4 bottom-4 w-64 h-52">
        <MessageLog messages={messageLog} />
     </div>

    </div>
  );
}

export default Table;
