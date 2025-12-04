// src/components/PotInfo.jsx
function PotInfo({ pot, phase }) {
  return (
    <div className="flex flex-col items-center text-sm font-semibold text-white">
      <div className="px-3 py-1 rounded-full bg-black/60 mb-1">
        底池: {pot}
      </div>
      <div className="px-2 py-0.5 rounded-full bg-black/40 text-xs">
        阶段: {phase}
      </div>
    </div>
  );
}

export default PotInfo;
