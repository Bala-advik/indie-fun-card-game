import React from 'react';

export default function GameOverScreen({ winner, myPlayerId, playerNames, playerHands, playerMelds, isPvp, isHost, ruleset, onRestart, onMainMenu }) {
  const isWinner = winner === myPlayerId;
  const winnerName = isWinner ? 'You' : (playerNames ? playerNames[winner] : (isPvp ? `Player ${winner.replace('p', '')}` : 'PC'));
  
  // Helper to render stacked hand
  const RenderStackedHand = ({ playerId }) => {
    if (ruleset === 'rummy_lite') {
      const melds = playerMelds?.[playerId] || [[], [], []];
      const handRemnant = playerHands[playerId] || [];
      
      const allGroups = [...melds.filter(m => m.length > 0), handRemnant].filter(g => g.length > 0);
      
      return (
        <div className="card-hand-container !min-h-[100px] sm:!min-h-[160px] !pb-2 px-2 py-2 scale-75 sm:scale-90 md:scale-100 flex-wrap justify-center origin-bottom">
          {allGroups.map((group, groupIdx) => {
            return group.map((card, idx) => (
              <div 
                key={`${groupIdx}-${card.id}`} 
                className={`playing-card-wrapper shrink-0 rounded-xl overflow-hidden bg-white border border-slate-300 shadow-md relative select-none ${idx === 0 && groupIdx !== 0 ? 'rummy-spacer' : ''}`}
                style={{ zIndex: groupIdx * 10 + idx }}
              >
                <img src={card.svg} alt={card.name} className="w-full h-full object-contain pointer-events-none" />
              </div>
            ));
          })}
        </div>
      );
    } else {
      const hand = playerHands[playerId] || [];
      return (
        <div className="card-hand-container !min-h-[100px] sm:!min-h-[160px] !pb-2 px-2 py-2 scale-75 sm:scale-90 md:scale-100 justify-center origin-bottom">
          {hand.map((card, idx) => (
            <div 
              key={card.id} 
              className="playing-card-wrapper shrink-0 rounded-xl overflow-hidden bg-white border border-slate-300 shadow-md relative select-none"
              style={{ zIndex: idx }}
            >
              <img src={card.svg} alt={card.name} className="w-full h-full object-contain pointer-events-none" />
            </div>
          ))}
        </div>
      );
    }
  };

  // To avoid crowding, show winner's hand and my hand. If I am the winner, show one opponent.
  const opponentId = winner === myPlayerId ? Object.keys(playerHands).find(id => id !== myPlayerId && playerHands[id]?.length > 0) : winner;
  const opponentName = opponentId === winner ? winnerName : (playerNames ? playerNames[opponentId] : (isPvp ? `Player ${opponentId?.replace('p', '')}` : 'PC'));
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 relative z-50">
      <div className="absolute inset-0 bg-slate-950/90 z-0"></div>

      <div className="z-10 max-w-3xl w-full max-h-[95vh] flex flex-col text-center bg-slate-900 p-4 sm:p-6 md:p-10 rounded-3xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Victory/Defeat Banner */}
        <div className="flex flex-col items-center gap-1 sm:gap-2 shrink-0">
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

        {/* Showcase Hands (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-2 py-2 border-y border-slate-850 my-2 sm:my-4 scrollbar-hide">
          
          {/* Player hand showcase */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-slate-900 px-3 py-1 rounded-full shadow-inner border border-slate-800">Your Hand</span>
            <RenderStackedHand playerId={myPlayerId} />
          </div>

          {/* PC/Opponent hand showcase */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider bg-slate-900 px-3 py-1 rounded-full shadow-inner border border-slate-800">{opponentName}'s Hand</span>
            {opponentId && <RenderStackedHand playerId={opponentId} />}
          </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center pt-2 shrink-0">
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
