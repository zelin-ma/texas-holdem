// src/components/CommunityCards.jsx
function CommunityCards({ cards }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {cards.map((c, idx) => {
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
    </div>
  );
}

export default CommunityCards;
