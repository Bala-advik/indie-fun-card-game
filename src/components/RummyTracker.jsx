import React from 'react';
import { validateRummyWin, isValidMeld } from '../utils/rummyLogic';
import { SUIT_COLORS, SUIT_SYMBOLS } from '../utils/deck';

export default function RummyTracker({ hand, melds, onDropToMeld, onRestoreFromMeld, onMeldClick }) {
  const capacities = [4, 3, 3];

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, meldIndex) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) {
      // Prevent overfilling a slot
      if (melds[meldIndex].length < capacities[meldIndex]) {
        onDropToMeld(cardId, meldIndex);
      }
    }
  };

  const isFull = melds[0].length === 4 && melds[1].length === 3 && melds[2].length === 3;
  const isAllValid = isFull && isValidMeld(melds[0]) && isValidMeld(melds[1]) && isValidMeld(melds[2]);
  const isComplete = isAllValid; // Ready to declare only if full AND valid

  return (
    <div className="bg-slate-950/80 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 shadow-lg z-10 relative">
      <div className="flex justify-between items-center px-1 mb-1 sm:mb-2">
        <h3 className="font-bold text-[10px] sm:text-xs text-indigo-400 uppercase tracking-widest">
          Rummy Lite Objective
        </h3>
        {melds.some(m => m.length > 0) && (
          <button 
            onClick={onSortMelds}
            className="text-[9px] sm:text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded shadow"
          >
            Sort by Melds
          </button>
        )}
      </div>

      <p className="text-[9px] sm:hidden text-slate-400 italic mb-2 text-center leading-tight">
        (Select cards from your hand, then tap a slot below to move them)
      </p>

      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-slate-400 tracking-wider uppercase">
          Status
        </span>
        <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-300">
          <span className={`font-bold ${isComplete ? 'text-amber-400' : isFull ? 'text-red-400' : 'text-blue-400'}`}>{isComplete ? 'READY TO DECLARE' : isFull ? 'INVALID MELDS' : 'In Progress'}</span>
        </span>
      </div>

      <div className="flex flex-row gap-1 sm:gap-2">
        {capacities.map((capacity, i) => {
          const slotFull = melds[i].length === capacity;
          const slotValid = slotFull && isValidMeld(melds[i]);
          const slotError = slotFull && !slotValid;
          
          let slotClass = 'bg-slate-900/60 border border-slate-800 border-dashed';
          let textClass = 'text-slate-400';
          if (slotValid) {
            slotClass = 'bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
            textClass = 'text-emerald-400';
          } else if (slotError) {
            slotClass = 'bg-red-950/40 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]';
            textClass = 'text-red-400';
          }

          return (
          <div 
            key={i} 
            data-meld-index={i}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, i)}
            onClick={() => onMeldClick && onMeldClick(i)}
            className={`flex-1 rounded-lg p-1 sm:p-2 text-center transition cursor-pointer ${slotClass}`}
          >
            <div className={`text-[7px] sm:text-[10px] font-bold mb-1 uppercase tracking-wider ${textClass}`}>
              {capacity} {slotValid ? '✅' : slotError ? '❌' : `(${melds[i].length}/${capacity})`}
            </div>
            
            <div className="flex justify-center gap-1 min-h-[20px] sm:min-h-[28px]">
              {/* Render placeholders for empty slots */}
              {Array.from({ length: capacity - melds[i].length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="w-3.5 h-4.5 sm:w-5 sm:h-7 bg-slate-800/50 rounded border border-slate-700/50"></div>
              ))}
              
              {/* Render actual cards placed in the meld */}
              {melds[i].map(card => (
                <div 
                  key={card.id} 
                  onClick={() => onRestoreFromMeld(card.id, i)}
                  className="bg-white rounded px-0.5 py-0.5 min-w-[14px] sm:min-w-[20px] text-center shadow cursor-pointer hover:-translate-y-1 transition-transform flex flex-col items-center justify-center"
                  title="Click to return to hand"
                >
                  {card.isJoker ? (
                    <span className="text-[7px] sm:text-[10px] font-black text-amber-500 leading-none">JK</span>
                  ) : (
                    <div className="flex flex-col items-center leading-none">
                      <span className={`text-[8px] sm:text-[11px] font-black ${SUIT_COLORS[card.suit]}`}>{card.rank}</span>
                      <span className={`text-[7px] sm:text-[9px] ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-900 text-center">
         <p className="text-[8px] sm:text-[10px] text-slate-400 italic">
           *At least <strong className="text-amber-400">one pure sequence</strong> (run without jokers) is required.
         </p>
      </div>
    </div>
  );
}
