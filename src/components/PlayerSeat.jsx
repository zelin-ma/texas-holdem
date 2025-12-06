// src/components/PlayerSeat.jsx
import { useEffect, useRef, useState } from "react";

function PlayerSeat({ player, isCurrent, isThinking, position, showCards = true}) {
  const { name, chips, cards, folded, allIn, busted } = player;

  const [floatEvents, setFloatEvents] = useState([]);
  const prevChipsRef = useRef(undefined);

  // do floatevent after chips change
  useEffect(() => {
    const prev = prevChipsRef.current;

    // first render don't use event
    if (prev === undefined) {
      prevChipsRef.current = chips;
      return;
    }

    if (chips === prev) return;

      const diff = chips - prev;
      const id = Date.now() + Math.random();

      // floatevent
      setFloatEvents((events) => [...events, { id, diff }]);

      // delate event
      const timeout = setTimeout(() => {
        setFloatEvents((events) => events.filter((e) => e.id !== id));
      }, 1700);

      prevChipsRef.current = chips;

      return() => clearTimeout(timeout);
  }, [chips]);

    // chips number float
    let floatPosClass = "absolute -top-8 left-1/2 -translate-x-1/2";
      if (position === "left") {
        floatPosClass =
          "absolute top-1/2 left-full -translate-y-1/2 ml-2";
      } else if (position === "right") {
        floatPosClass =
          "absolute top-1/2 right-full -translate-y-1/2 mr-2";
      } else if (position === "top") {
        floatPosClass =
          "absolute top-full left-1/2 -translate-x-1/2 mt-2";
      } else if (position === "bottom") {
        floatPosClass =
          "absolute -top-8 left-1/2 -translate-x-1/2";
      }

  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        (folded || busted ? "opacity-60" : "")
      }`}
    >
      <div className={floatPosClass + " pointer-events-none"}>
        {floatEvents.map((e) => (
          <div
            key={e.id}
            className={
              "text-5xl font-extrabold animate-floatUp " +
              (e.diff < 0 ? "text-red-500" : "text-lime-300")
            }
          >
            {e.diff > 0 ? `+${e.diff}` : e.diff}
          </div>
        ))}
      </div>

      {/* hand cards*/}
      <div className="flex gap-2 mb-1">
        
        {cards.map((c, idx) =>{
          if (!showCards) {
            // 
            return (
              <div
                key={idx}
                className="w-16 h-24 bg-sky-500 border-2 border-black rounded-md shadow-md"
              />
            );
          }
          const isRed = c.suit === "♥" || c.suit === "♦";
          return (
            <div
              key={idx}
              className={
                "w-16 h-24 bg-sky-500 border-2 border-black rounded-md flex items-center justify-center text-xl font-bold shadow-md " +
                (isRed ? "text-red-600" : "text-black")
              }
            >
              {c.rank}
              {c.suit}
            </div>
          );
        })}
      </div>

      {/* chips */}
      <div className="flex flex-col items-center">
        <div
          className={`w-14 h-14 rounded-full bg-red-500 shadow-md border-2 border-red-700 ${
            isCurrent ? "ring-4 ring-yellow-300 animate-pulse" : ""
          }`}
        />
        <div className="mt-1 text-base font-semibold">{chips}</div>
      </div>

      <div className="text-sm font-semibold">
        {name}{" "}
        {busted && <span className="text-red-200 ml-1">(Busted)</span>}
        {!busted && folded && <span className="text-gray-700">(Fold)</span>}
        {allIn && !busted && <span className="text-red-700 ml-1">ALL-IN</span>}
        {isThinking && !busted && <span className="text-yellow-200 ml-1">Actioning...</span>}
      </div>
    </div>
  );
}

export default PlayerSeat;

