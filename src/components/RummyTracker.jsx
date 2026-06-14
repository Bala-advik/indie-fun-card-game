import React from 'react';
import { validateRummyWin } from '../utils/rummyLogic';
import { SUIT_COLORS, SUIT_SYMBOLS } from '../utils/deck';

export default function RummyTracker({ hand }) {
  // Validate hand to see if it's currently a winning hand
  const { isWin, melds } = validateRummyWin(hand);

  return (
    <div className="bg-slate-950/80 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 shadow-lg z-10 relative">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-slate-400 tracking-wider uppercase">
          Rummy Lite Objective
        </span>
        <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-300">
          Status: <span className={`font-bold ${isWin ? 'text-amber-400' : 'text-blue-400'}`}>{isWin ? 'COMPLETED!' : 'In Progress'}</span>
        </span>
      </div>

      {isWin && melds ? (
        <div className="flex flex-col sm:flex-row gap-2">
          {melds.map((meld, i) => (
            <div key={i} className="flex-1 bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-1.5 sm:p-2 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              <div className="text-[8px] sm:text-[10px] text-emerald-400 font-bold mb-1 text-center uppercase tracking-wider">
                {meld.length}-Card Meld
              </div>
              <div className="flex justify-center gap-1">
                {meld.map(card => (
                  <div key={card.id} className="bg-white rounded px-1 py-0.5 min-w-[18px] text-center shadow">
                    {card.isJoker ? (
                      <span className="text-[8px] sm:text-[10px] font-black text-amber-500">JK</span>
                    ) : (
                      <div className="flex flex-col items-center leading-none">
                        <span className={`text-[9px] sm:text-[11px] font-black ${SUIT_COLORS[card.suit]}`}>{card.rank}</span>
                        <span className={`text-[8px] sm:text-[9px] ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1.5 sm:p-2 text-center opacity-70">
             <div className="text-[8px] sm:text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">4-Card Run/Set</div>
             <div className="flex justify-center gap-1">
               {[1,2,3,4].map(n => <div key={n} className="w-4 h-5 sm:w-5 sm:h-7 bg-slate-800 rounded border border-slate-700"></div>)}
             </div>
          </div>
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1.5 sm:p-2 text-center opacity-70">
             <div className="text-[8px] sm:text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">3-Card Run/Set</div>
             <div className="flex justify-center gap-1">
               {[1,2,3].map(n => <div key={n} className="w-4 h-5 sm:w-5 sm:h-7 bg-slate-800 rounded border border-slate-700"></div>)}
             </div>
          </div>
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1.5 sm:p-2 text-center opacity-70">
             <div className="text-[8px] sm:text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">3-Card Run/Set</div>
             <div className="flex justify-center gap-1">
               {[1,2,3].map(n => <div key={n} className="w-4 h-5 sm:w-5 sm:h-7 bg-slate-800 rounded border border-slate-700"></div>)}
             </div>
          </div>
        </div>
      )}

      <div className="mt-2 pt-1.5 border-t border-slate-900 text-center">
         <p className="text-[8px] sm:text-[10px] text-slate-400 italic">
           *At least <strong className="text-amber-400">one pure sequence</strong> (run without jokers) is required.
         </p>
      </div>
    </div>
  );
}
