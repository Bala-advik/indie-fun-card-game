import React, { useState } from 'react';

export default function WelcomeScreen({ onStartPc, onCreatePvp, onJoinPvp, onStartPvpGame, connectionState, roomCode, connectedGuests, expectedGuests }) {
  const [joinCode, setJoinCode] = useState('');
  const [numPlayers, setNumPlayers] = useState(2);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinPvp(joinCode.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 overflow-y-auto custom-scroll">
      <div className="absolute inset-0 bg-radial from-emerald-950/20 via-slate-950 to-slate-950 z-0"></div>
      
      <div className="z-10 max-w-xl w-full text-center space-y-6 bg-slate-900/90 p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="space-y-2">
          <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            Royal Sequence Card Game
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            ROYAL SEQUENCE
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Arrange your hand into an Ace-to-King sequence. Use Jokers as wildcards to win!
          </p>
        </div>

        {/* Loading / Connecting Screens in Welcome Panel */}
        {connectionState === 'connecting' && (
          <div className="py-6 space-y-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-blue-400 font-bold">Connecting to matchmaking server...</p>
          </div>
        )}

        {connectionState === 'waiting' && (
          <div className="py-6 px-4 space-y-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="animate-pulse flex flex-col items-center gap-1.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-sm text-emerald-400 font-black tracking-wide">WAITING FOR PLAYERS...</p>
            </div>
            
            <div className="text-sm font-bold text-slate-300">
              Players Joined: {connectedGuests + 1} / {expectedGuests + 1}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400">Share this connection link with your friends:</p>
              <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}${window.location.pathname}?room=${roomCode}`}
                  className="bg-transparent flex-1 text-slate-300 outline-none select-all font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?room=${roomCode}`);
                    alert('Invite link copied to clipboard!');
                  }}
                  className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black rounded hover:bg-emerald-400 text-[10px]"
                >
                  COPY
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Or share the code: <span className="font-mono font-bold text-amber-400">{roomCode}</span></p>
            </div>

            {onStartPvpGame && (
              <button
                onClick={onStartPvpGame}
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold rounded-xl transition cursor-pointer"
              >
                Start Game Now
              </button>
            )}
          </div>
        )}

        {/* Standard Menu options */}
        {connectionState === 'disconnected' && (
          <div className="space-y-4">
            
            {/* Player Selection */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Number of Players</label>
              <div className="flex gap-2 justify-center">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setNumPlayers(num)}
                    className={`flex-1 py-2 rounded-lg font-black text-sm transition-all border ${numPlayers === num ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                  >
                    {num} Players
                  </button>
                ))}
              </div>
            </div>

            {/* Play Offline Option */}
            <button
              onClick={() => onStartPc(numPlayers)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg transition duration-200 cursor-pointer"
            >
              Play vs Computer (Offline)
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800"></span>
              </div>
              <span className="relative px-3 bg-slate-900 text-xs text-slate-500 font-bold uppercase">Or Play Online PvP</span>
            </div>

            {/* Create Lobby */}
            <button
              onClick={() => onCreatePvp(numPlayers)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
            >
              Create Online PvP Lobby
            </button>

            {/* Join Lobby */}
            <form onSubmit={handleJoinSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Room Code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl flex-1 outline-none focus:border-blue-500 text-sm font-mono text-center tracking-wider"
              />
              <button
                type="submit"
                className="px-6 bg-blue-600 hover:bg-blue-500 text-slate-100 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>
        )}

        {/* Quick Rules Summary */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 text-left text-xs text-slate-400 space-y-2">
          <h4 className="font-bold text-amber-400">Winning Sequence Concept:</h4>
          <p>Assemble your 13 cards into ranks: <span className="text-emerald-400 font-bold">A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K</span>. You can use any combinations of suits. Red/Black Jokers act as wildcards to substitute for missing card ranks.</p>
        </div>
      </div>
    </div>
  );
}
