import React from 'react';

export default function Card({
  card,
  index,
  totalCards,
  isSelected,
  isNewlyDrawn,
  turnState,
  onSelect,
  onDiscard,
  onDragStart,
  onDragOver,
  onDrop,
  onDropToMeldMobile,
  isSpacer,
  showDiscardOverlay
}) {
  const centerIndex = (totalCards - 1) / 2;
  const offset = index - centerIndex;

  // Fanning formula
  const rotation = offset * (totalCards > 13 ? 2.2 : 2.5);
  // Flatten the Y curve so the outer cards don't drop too low, creating a wider desktop-like arc
  const translateValY = Math.pow(Math.abs(offset), 2) * (totalCards > 13 ? 1.0 : 1.15);
  const translateValX = offset * -2;

  const style = {
    transform: `rotate(${rotation}deg) translateY(${translateValY}px) translateX(${translateValX}px)`,
    zIndex: index,
  };

  const handleCardClick = () => {
    if (showDiscardOverlay) {
      if (turnState === 'player_discard') onSelect(card.id);
    } else {
      if (turnState !== 'opponent_turn') onSelect(card.id);
    }
  };

  const handleCardDoubleClick = () => {
    if (turnState === 'player_discard') {
      onDiscard(card.id);
    }
  };

  const handleTouchStart = (e) => {
    // Only drag on single touch
    if (e.touches.length === 1) {
      onDragStart({ dataTransfer: { effectAllowed: '' } }, card.id);
    }
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const meldTarget = dropTarget?.closest('[data-meld-index]');
    const targetCardId = dropTarget?.closest('.playing-card-wrapper')?.getAttribute('data-card-id');
    
    if (meldTarget && onDropToMeldMobile) {
      const meldIndex = parseInt(meldTarget.getAttribute('data-meld-index'), 10);
      onDropToMeldMobile(card.id, meldIndex);
    } else if (targetCardId && targetCardId !== card.id) {
      onDrop({ preventDefault: () => {} }, targetCardId);
    } else if (dropTarget) {
      onDrop({ preventDefault: () => {} }, null);
    }
  };

  return (
    <div
      data-card-id={card.id}
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, card.id)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      className={`playing-card-wrapper shrink-0 rounded-xl overflow-hidden bg-white shadow-xl ${isSelected ? 'selected' : ''} ${isNewlyDrawn ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : ''} ${isSpacer ? 'rummy-spacer' : ''}`}
      style={style}
    >
      <img
        src={card.svg}
        alt={card.name}
        className="w-full h-full object-contain select-none"
      />

      {/* Newly Drawn Tag */}
      {isNewlyDrawn && (
        <span className="absolute top-1 right-1 bg-blue-600 text-slate-100 text-[7px] sm:text-[9px] font-black px-1 py-0.5 rounded shadow border border-blue-400 uppercase tracking-wider z-10">
          New
        </span>
      )}

      {/* Discard Overlay Action Button on Card (Tap to confirm) */}
      {showDiscardOverlay && turnState === 'player_discard' && isSelected && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDiscard(card.id);
          }}
          className="absolute inset-0 bg-slate-950/70 flex items-center justify-center z-50 cursor-pointer animate-fade-in"
        >
          <div className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg px-2.5 py-1 text-[10px] md:text-xs tracking-wider shadow-lg">
            DISCARD
          </div>
        </div>
      )}
    </div>
  );
}
