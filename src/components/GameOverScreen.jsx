import React from 'react';

export default function GameOverScreen({ winner, myPlayerId, playerHands, playerMelds, isPvp, isHost, ruleset, onRestart, onMainMenu }) {
  const isWinner = winner === myPlayerId;
  const winnerName = isWinner ? 'You' : (isPvp ? `Player ${winner.replace('p', '')}` : 'PC');
  
  // Combine hands and melds for display
  const getFullHand = (playerId) => {
    let hand = playerHands[playerId] || [];
    if (ruleset === 'rummy_lite' && playerMelds && playerMelds[playerId]) {
      const melds = playerMelds[playerId].flat();
      hand = [...hand, ...melds];
    }
    return hand;
  };

  const myHand = getFullHand(myPlayerId);
  
  // To avoid crowding, show winner's hand and my hand. If I am the winner, show one opponent.
  const opponentId = winner === myPlayerId ? Object.keys(playerHands).find(id => id !== myPlayerId && playerHands[id]?.length > 0) : winner;
  const opponentHand = opponentId ? getFullHand(opponentId) : [];
  const opponentName = opponentId === winner ? winnerName : (isPvp ? `Player ${opponentId?.replace('p', '')}` : 'PC');
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-50">
      <div className="absolute inset-0 bg-slate-950/90 z-0"></div>

      <div className="z-10 max-w-3xl w-full text-center space-y-6 bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative">
        
        {/* Victory/Defeat Banner */}
        <div className="flex flex-col items-center gap-2">
          {isWinner ? (
            <>
              <span className="text-6xl animate-bounce">🏆</span>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                VICTORY IS YOURS!
              </h1>
              <p className="text-emerald-400 font-medium">
                {ruleset === 'rummy_lite' 
                  ? 'You successfully formed the 4:3:3 melds!' 
                  : 'You completed the Ace-to-King sequence first!'}
              </p>
            </>
          ) : (
            <>
              <span className="text-6xl">🤖</span>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-500 to-red-400 bg-clip-text text-transparent">
                {winnerName.toUpperCase()} WINS!
              </h1>
              <p className="text-rose-400 font-medium">
                {ruleset === 'rummy_lite' 
                  ? `${winnerName} formed the 4:3:3 melds before you!` 
                  : `${winnerName} completed the Ace-to-King sequence before you!`}
              </p>
            </>
          )}
        </div>

        {/* Showcase Hands */}
        <div className="space-y-4 py-4 border-y border-slate-850">
          
          {/* Player hand showcase */}
          <div className="text-left space-y-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Your Hand</span>
            <div className="flex gap-1 overflow-x-auto pb-2 custom-scroll">
              {myHand.map((card) => (
                <div key={card.id} className="w-12 h-[68px] flex-shrink-0 bg-white rounded-md overflow-hidden border border-slate-300 shadow">
                  <img src={card.svg} alt={card.name} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* PC/Opponent hand showcase */}
          <div className="text-left space-y-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">{opponentName}'s Hand</span>
            <div className="flex gap-1 overflow-x-auto pb-2 custom-scroll">
              {opponentHand.map((card) => (
                <div key={card.id} className="w-12 h-[68px] flex-shrink-0 bg-white rounded-md overflow-hidden border border-slate-300 shadow">
                  <img src={card.svg} alt={card.name} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          {(!isPvp || isHost) ? (
            <button
              onClick={onRestart}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transform hover:scale-105 active:scale-95 transition cursor-pointer text-sm md:text-base shadow-lg shadow-emerald-900/30"
            >
              Play Again
            </button>
          ) : (
            <div className="px-8 py-3.5 bg-slate-700/50 text-slate-300 font-bold rounded-xl text-sm md:text-base flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Waiting for Host...
            </div>
          )}
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
