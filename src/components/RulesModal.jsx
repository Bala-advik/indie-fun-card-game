import React from 'react';

export default function RulesModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative custom-scroll">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-amber-400 tracking-wide">Game Rules & Logic</h3>
          <p className="text-sm text-slate-400">
            Learn the mechanics of Royal Sequence.
          </p>
        </div>

        <div className="space-y-4 text-xs md:text-sm text-slate-300">
          <section className="space-y-1">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">Deck Setup</h4>
            <p>The game is played with two standard card decks plus four Jokers (total 108 cards). You and the computer opponent are dealt 13 cards each. The remaining cards form the Draw Deck.</p>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">Turn Flow</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>First, choose to draw a card from either the top of the <span className="font-semibold text-white">Draw Deck</span> (unseen) or the top of the <span className="font-semibold text-white">Discard Pile</span> (visible).</li>
              <li>With 14 cards in your hand, you must select and discard 1 card to the discard pile, returning your hand size to 13.</li>
            </ol>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">The Winning Goal</h4>
            <p>Your goal is to arrange your 13 cards so they cover all 13 distinct card ranks from Ace (A) to King (K) in any suit combinations:</p>
            <div className="p-2.5 bg-slate-950/60 rounded-lg text-amber-400 font-mono text-center font-bold tracking-wider mt-1 text-xs">
              A - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 - 10 - J - Q - K
            </div>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">Joker Wildcards</h4>
            <p>The 4 Jokers act as wildcards. A Joker can represent *any* rank you are currently missing in your sequence. For instance, if you have A, 2, 3, 4, Joker, 6... the Joker acts as the 5 of any suit. You can use as many Jokers as you hold to fill the gaps!</p>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">Player Actions</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold text-white">Auto-Sort</span>: Organizes your hand immediately by rank or suit.</li>
              <li><span className="font-semibold text-white">Reorder</span>: Drag & drop cards left/right to arrange them manually.</li>
              <li><span className="font-semibold text-white">Double-click</span>: Discards the card on your turn.</li>
            </ul>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer text-sm"
        >
          Got It!
        </button>
      </div>
    </div>
  );
}
