import React, { useEffect } from 'react';

export default function ChatBubble({ message, onClear }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClear();
      }, 4000); // Fades out and clears after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none chat-bubble-popup">
      <div className="bg-slate-900/90 text-amber-400 font-black text-xs md:text-sm px-4 py-2 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-sm relative whitespace-nowrap flex items-center gap-1.5 animate-bounce-slow">
        {message}
        {/* Little triangle pointing upwards to the hand */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-l border-t border-slate-700 rotate-45"></div>
      </div>
    </div>
  );
}
