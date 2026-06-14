import React from 'react';
import { RANKS, SUIT_SYMBOLS, SUIT_COLORS } from '../utils/deck';

export default function SequenceTracker({ mapping, redundantCards, unusedJokers }) {
  const matchedCount = Object.values(mapping).filter(s => s.matched).length;

  return (
    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shadow-lg z-10 relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] md:text-xs font-black text-slate-400 tracking-wider uppercase">Your Sequence Objective</span>
        <span className="text-[10px] md:text-xs text-slate-300">
          Unique Ranks: <span className="font-bold text-emerald-400">{matchedCount}/13</span>
        </span>
      </div>
      
      <div className="grid grid-cols-7 sm:grid-cols-13 gap-1 md:gap-1.5">
        {RANKS.map((rank) => {
          const slot = mapping[rank];
          
          return (
            <div 
              key={rank}
              className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg border text-center transition-all ${slot.matched ? (slot.isWildcard ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_5px_rgba(245,158,11,0.2)]' : 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_5px_rgba(16,185,129,0.2)]') : 'bg-slate-900/40 border-slate-800 opacity-45'}`}
            >
              <span className={`text-xs md:text-sm font-black ${slot.matched ? (slot.isWildcard ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-500'}`}>
                {rank}
              </span>
              <div className="h-4 sm:h-5 flex items-center justify-center mt-0.5">
                {slot.matched ? (
                  slot.isWildcard ? (
                    <span className="text-[8px] sm:text-[9px] px-1 bg-amber-500 text-slate-950 font-bold rounded">JK</span>
                  ) : (
                    <span className={`text-[11px] font-bold ${SUIT_COLORS[slot.card.suit]}`}>
                      {SUIT_SYMBOLS[slot.card.suit]}
                    </span>
                  )
                ) : (
                  <span className="text-[9px] text-slate-600 font-bold">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Redundant Cards & Spare Jokers footer details */}
      {(redundantCards.length > 0 || unusedJokers.length > 0) && (
        <div className="mt-2 pt-2 border-t border-slate-900 flex flex-wrap gap-2 items-center text-[10px] text-slate-400">
          <span className="font-semibold text-slate-500">Unused Cards:</span>
          {unusedJokers.map((j, i) => (
            <span key={`uj-${i}`} className="px-1.5 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-900 rounded font-bold">
              Joker
            </span>
          ))}
          {redundantCards.map((c) => (
            <span key={c.id} className={`px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded font-bold ${SUIT_COLORS[c.suit]}`}>
              {c.rank}{SUIT_SYMBOLS[c.suit]}
            </span>
          ))}
          <span className="text-slate-500 italic ml-auto">(duplicate ranks don't help your sequence)</span>
        </div>
      )}
    </div>
  );
}
