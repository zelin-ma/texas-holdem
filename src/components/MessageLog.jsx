// src/components/MessageLog.jsx
import { useEffect, useRef } from "react";

function MessageLog({ messages }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight; // Every time messages change, scroll to the bottom.
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black/50 text-white text-xs rounded-md p-2 overflow-y-auto"
    >
      <div className="font-semibold mb-1">日志</div>
      <ul className="space-y-1">
        {messages.map((msg, idx) => (
          <li key={idx} className="leading-snug">
            • {msg}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MessageLog;
