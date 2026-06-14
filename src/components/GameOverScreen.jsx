import React from 'react';

export default function GameOverScreen({ winner, playerHand, pcHand, onRestart, onMainMenu }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-50">
      <div className="absolute inset-0 bg-slate-950/90 z-0"></div>

      <div className="z-10 max-w-3xl w-full text-center space-y-6 bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative">
        
        {/* Victory/Defeat Banner */}
        <div className="flex flex-col items-center gap-2">
          {winner === 'player' ? (
            <>
              <span className="text-6xl animate-bounce">🏆</span>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                VICTORY IS YOURS!
              </h1>
              <p className="text-emerald-400 font-medium">You completed the Ace-to-King sequence first!</p>
            </>
          ) : (
            <>
              <span className="text-6xl">🤖</span>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-500 to-red-400 bg-clip-text text-transparent">
                PC WINS!
              </h1>
              <p className="text-slate-400 font-medium">The computer assembled the sequence first.</p>
            </>
          )}
        </div>

        {/* Showcase Hands */}
        <div className="space-y-4 py-4 border-y border-slate-850">
          
          {/* Player hand showcase */}
          <div className="text-left space-y-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Your Hand</span>
            <div className="flex gap-1 overflow-x-auto pb-2 custom-scroll">
              {playerHand.map((card) => (
                <div key={card.id} className="w-12 h-[68px] flex-shrink-0 bg-white rounded-md overflow-hidden border border-slate-300 shadow">
                  <img src={card.svg} alt={card.name} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* PC hand showcase */}
          <div className="text-left space-y-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">PC's Hand</span>
            <div className="flex gap-1 overflow-x-auto pb-2 custom-scroll">
              {pcHand.map((card) => (
                <div key={card.id} className="w-12 h-[68px] flex-shrink-0 bg-white rounded-md overflow-hidden border border-slate-300 shadow">
                  <img src={card.svg} alt={card.name} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <button
            onClick={onRestart}
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transform hover:scale-105 active:scale-95 transition cursor-pointer text-sm md:text-base shadow-lg shadow-emerald-900/30"
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition cursor-pointer text-sm md:text-base"
          >
            Main Menu
          </button>
        </div>

      </div>
    </div>
  );
}
