import React from 'react';

export default function GameLogs({ logs, onClose }) {
  return (
    <div className="fixed top-0 right-0 h-full w-80 md:w-96 bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col justify-between p-4 animate-fade-in-right">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <h3 className="font-black text-amber-400 text-sm md:text-base tracking-wider flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          GAME LOGS
        </h3>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-2.5 text-xs md:text-sm custom-scroll">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`p-2.5 rounded-lg border ${
              log.includes('🏆') || log.includes('💻') 
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 font-bold' 
                : log.includes('Player') 
                  ? 'bg-blue-950/20 border-blue-900/30 text-blue-200' 
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
            }`}
          >
            {log}
          </div>
        ))}
      </div>

      <div className="text-[10px] text-slate-500 text-center border-t border-slate-850 pt-3">
        Card Clash v1.0.0
      </div>
    </div>
  );
}
