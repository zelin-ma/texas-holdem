// src/components/PotInfo.jsx
function PotInfo({ pot, phase }) {
  return (
    <div className="flex flex-col items-center text-sm font-semibold text-white">
      <div className="px-3 py-1 rounded-full bg-black/60 mb-1">
        Pot: {pot}
      </div>
      <div className="px-2 py-0.5 rounded-full bg-black/40 text-xs">
        Phase: {phase}
      </div>
    </div>
  );
}

export default PotInfo;
