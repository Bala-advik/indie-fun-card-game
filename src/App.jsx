import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Import game utilities
import {
  create108Deck,
  shuffle,
  checkWinCondition,
  getHandSequenceMapping,
  sortHandByRank,
  sortHandBySuit,
  evaluatePcDiscard
} from './utils/deck';

// Import multiplayer helper
import {
  initPeer,
  connectToHost
} from './utils/multiplayer';

// Import modular components
import Card from './components/Card';
import SequenceTracker from './components/SequenceTracker';
import WelcomeScreen from './components/WelcomeScreen';
import GameOverScreen from './components/GameOverScreen';
import RulesModal from './components/RulesModal';
import GameLogs from './components/GameLogs';
import ChatBubble from './components/ChatBubble';

const QUICK_CHAT_OPTIONS = [
  "Hello! 👋",
  "Nice move! 👍",
  "Oops! 😅",
  "Good game! 🤝",
  "Aha! 💡",
  "Oh no! 😱",
  "Joker power! 🃏",
  "Almost there! 🎯"
];

export default function App() {
  // Game Modes & Networking state
  const [gameMode, setGameMode] = useState('pc');
  const [myRole, setMyRole] = useState('none');
  const [myPlayerId, setMyPlayerId] = useState('p1');
  const [roomCode, setRoomCode] = useState('');
  const [connectionState, setConnectionState] = useState('disconnected');

  // Game states
  const [gameState, setGameState] = useState('welcome');
  const [numPlayers, setNumPlayers] = useState(2);
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [playerHands, setPlayerHands] = useState({ p1: [], p2: [], p3: [], p4: [] });

  const [activePlayer, setActivePlayer] = useState('p1');
  const [turnPhase, setTurnPhase] = useState('draw');
  const [newlyDrawnCardId, setNewlyDrawnCardId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [winner, setWinner] = useState(null);

  // UI Panels
  const [showRules, setShowRules] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [gameLogs, setGameLogs] = useState([]);
  const [pcStatus, setPcStatus] = useState('Waiting for your turn...');
  const [isPcThinking, setIsPcThinking] = useState(false);

  // Chat Bubbles State
  const [chatMessages, setChatMessages] = useState({ p1: null, p2: null, p3: null, p4: null });

  // PeerJS Refs
  const peerRef = useRef(null);
  const hostConnRef = useRef(null);
  const guestConnsRef = useRef({});

  const [connectedGuests, setConnectedGuests] = useState(0);
  const [actionQueue, setActionQueue] = useState([]);

  const logAction = (msg) => {
    setGameLogs(prev => [msg, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      joinPvpLobby(roomFromUrl);
    }
    return () => cleanupPeer();
  }, []);

  const cleanupPeer = () => {
    if (hostConnRef.current) {
      hostConnRef.current.close();
      hostConnRef.current = null;
    }
    Object.values(guestConnsRef.current).forEach(conn => conn.close());
    guestConnsRef.current = {};
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setConnectionState('disconnected');
    setMyRole('none');
    setMyPlayerId('p1');
    setConnectedGuests(0);
  };

  const getNextPlayer = (currentPlayer) => {
    const pNum = parseInt(currentPlayer.substring(1));
    const nextNum = (pNum % numPlayers) + 1;
    return `p${nextNum}`;
  };

  const startPcGame = (selectedNumPlayers = 2) => {
    setNumPlayers(selectedNumPlayers);
    setGameMode('pc');
    setMyRole('none');
    setMyPlayerId('p1');

    const freshDeck = shuffle(create108Deck());
    const newHands = { p1: [], p2: [], p3: [], p4: [] };

    for (let i = 1; i <= selectedNumPlayers; i++) {
      const pId = `p${i}`;
      const hand = freshDeck.splice(0, 13);
      newHands[pId] = i === 1 ? sortHandByRank(hand) : hand;
    }
    const firstDiscard = freshDeck.pop();

    setDeck(freshDeck);
    setDiscardPile([firstDiscard]);
    setPlayerHands(newHands);

    setActivePlayer('p1');
    setTurnPhase('draw');
    setNewlyDrawnCardId(null);
    setSelectedCardId(null);
    setWinner(null);

    setGameState('playing');
    setPcStatus('Waiting for your turn...');
    setIsPcThinking(false);
    setGameLogs([]);
    logAction(`Offline game vs ${selectedNumPlayers - 1} Computer(s) started.`);
    logAction(`Discard pile starts with ${firstDiscard.name}.`);
  };

  const createPvpLobby = (selectedNumPlayers = 2) => {
    cleanupPeer();
    setNumPlayers(selectedNumPlayers);
    setGameMode('pvp');
    setMyRole('host');
    setMyPlayerId('p1');
    setConnectionState('connecting');

    const peer = initPeer(
      (id) => {
        setRoomCode(id);
        setConnectionState('waiting');
        logAction(`Created PvP Lobby with code: ${id}`);
      },
      (incomingConn) => {
        incomingConn.on('open', () => {
          const currentGuestsCount = Object.keys(guestConnsRef.current).length;
          if (currentGuestsCount >= selectedNumPlayers - 1) {
            incomingConn.send({ type: 'error', message: 'Lobby is full.' });
            setTimeout(() => incomingConn.close(), 500);
            return;
          }

          const newGuestId = `p${currentGuestsCount + 2}`;
          guestConnsRef.current[newGuestId] = incomingConn;
          setConnectedGuests(Object.keys(guestConnsRef.current).length);
          logAction(`Player ${newGuestId.replace('p', '')} connected!`);

          incomingConn.send({ type: 'assign_id', playerId: newGuestId, numPlayers: selectedNumPlayers });

          incomingConn.on('data', (data) => {
            if (data.type === 'action') {
              setActionQueue(prev => [...prev, { guestId: newGuestId, actionData: data.actionData }]);
            } else if (data.type === 'chat') {
              broadcastChat(newGuestId, data.text);
            }
          });

          incomingConn.on('close', () => {
            logAction(`Player ${newGuestId.replace('p', '')} disconnected.`);
            alert(`Player ${newGuestId.replace('p', '')} disconnected. Game over.`);
            setGameState('welcome');
            cleanupPeer();
          });
        });
      },
      (err) => {
        console.error('PeerJS error:', err);
        setConnectionState('error');
        logAction('Network error occurred. Please try again.');
      }
    );
    peerRef.current = peer;
  };

  const startPvpGame = () => {
    if (Object.keys(guestConnsRef.current).length < numPlayers - 1) return;

    const freshDeck = shuffle(create108Deck());
    const newHands = { p1: [], p2: [], p3: [], p4: [] };

    for (let i = 1; i <= numPlayers; i++) {
      const pId = `p${i}`;
      newHands[pId] = sortHandByRank(freshDeck.splice(0, 13));
    }
    const firstDiscard = freshDeck.pop();

    const initialState = {
      deck: freshDeck,
      discardPile: [firstDiscard],
      playerHands: newHands,
      activePlayer: 'p1',
      turnPhase: 'draw',
      newlyDrawnCardId: null,
      winner: null
    };

    setDeck(freshDeck);
    setDiscardPile([firstDiscard]);
    setPlayerHands(newHands);
    setActivePlayer('p1');
    setTurnPhase('draw');
    setNewlyDrawnCardId(null);
    setSelectedCardId(null);
    setWinner(null);
    setGameState('playing');

    broadcastState(initialState);
  };

  const joinPvpLobby = (hostId) => {
    cleanupPeer();
    setGameMode('pvp');
    setMyRole('guest');
    setConnectionState('connecting');

    const peer = initPeer(
      (myId) => {
        const conn = connectToHost(
          peer,
          hostId,
          (establishedConn) => {
            hostConnRef.current = establishedConn;
            setConnectionState('waiting');
            setRoomCode(hostId);
            logAction('Connected to Lobby! Waiting for host to start game...');
          },
          (data) => {
            if (data.type === 'assign_id') {
              setMyPlayerId(data.playerId);
              setNumPlayers(data.numPlayers);
            } else if (data.type === 'sync_state') {
              handleSyncState(data.state);
            } else if (data.type === 'chat') {
              setChatMessages(prev => {
                const newChats = { ...prev };
                newChats[data.playerId] = data.text;
                return newChats;
              });
            } else if (data.type === 'error') {
              alert(data.message);
              cleanupPeer();
              setGameState('welcome');
            }
          },
          () => {
            logAction('Connection closed by host.');
            alert('Host disconnected. Returning to main menu.');
            setGameState('welcome');
            cleanupPeer();
            window.history.replaceState({}, document.title, window.location.pathname);
          },
          (err) => {
            console.error('Connection error:', err);
            logAction('Failed to connect to host.');
            setConnectionState('disconnected');
          }
        );
        hostConnRef.current = conn;
      },
      () => { },
      (err) => {
        console.error('Peer error:', err);
        setConnectionState('disconnected');
        logAction('Network error. Unable to join.');
      }
    );
    peerRef.current = peer;
  };

  const handleSyncState = (s) => {
    setDeck(s.deck);
    setDiscardPile(s.discardPile);
    setPlayerHands(s.playerHands);
    setActivePlayer(s.activePlayer);
    setTurnPhase(s.turnPhase);
    setNewlyDrawnCardId(s.newlyDrawnCardId);
    setWinner(s.winner);

    if (s.winner) {
      setGameState('game_over');
      logAction(`Game Over! Winner: Player ${s.winner.replace('p', '')}`);
    } else {
      setGameState('playing');
    }
  };

  const broadcastState = (state) => {
    if (myRole === 'host') {
      Object.values(guestConnsRef.current).forEach(conn => {
        conn.send({ type: 'sync_state', state });
      });
    }
  };

  const broadcastChat = (senderId, text) => {
    setChatMessages(prev => {
      const newChats = { ...prev };
      newChats[senderId] = text;
      return newChats;
    });

    if (myRole === 'host') {
      Object.values(guestConnsRef.current).forEach(conn => {
        conn.send({ type: 'chat', playerId: senderId, text });
      });
    } else if (myRole === 'guest' && hostConnRef.current) {
      hostConnRef.current.send({ type: 'chat', text });
    }

    setTimeout(() => {
      setChatMessages(prev => {
        const newChats = { ...prev };
        if (newChats[senderId] === text) newChats[senderId] = null;
        return newChats;
      });
    }, 4000);
  };

  useEffect(() => {
    if (actionQueue.length > 0) {
      const nextAction = actionQueue[0];

      if (nextAction.actionData.action === 'draw') {
        executeDrawCard(nextAction.guestId, nextAction.actionData.source);
      } else if (nextAction.actionData.action === 'discard') {
        executeDiscardCard(nextAction.guestId, nextAction.actionData.cardId);
      } else if (nextAction.actionData.action === 'reorder') {
        setPlayerHands(prev => {
          const next = { ...prev, [nextAction.guestId]: nextAction.actionData.newHand };
          broadcastState({ deck, discardPile, playerHands: next, activePlayer, turnPhase, newlyDrawnCardId, winner });
          return next;
        });
      }

      setActionQueue(prev => prev.slice(1));
    }
  }, [actionQueue, deck, discardPile, playerHands, activePlayer, turnPhase, newlyDrawnCardId, winner]);

  const handlePlayerSort = (type) => {
    const hand = [...playerHands[myPlayerId]];
    const newHand = type === 'rank' ? sortHandByRank(hand) : sortHandBySuit(hand);

    setPlayerHands(prev => ({ ...prev, [myPlayerId]: newHand }));
    logAction(`Player sorted hand by ${type === 'rank' ? 'Rank' : 'Suit'}.`);

    if (myRole === 'guest' && hostConnRef.current) {
      hostConnRef.current.send({ type: 'action', actionData: { action: 'reorder', newHand } });
    } else if (myRole === 'host') {
      broadcastState({ deck, discardPile, playerHands: { ...playerHands, [myPlayerId]: newHand }, activePlayer, turnPhase, newlyDrawnCardId, winner });
    }
  };

  const drawCard = (source) => {
    if (activePlayer !== myPlayerId || turnPhase !== 'draw') return;

    if (myRole === 'guest' && hostConnRef.current) {
      hostConnRef.current.send({ type: 'action', actionData: { action: 'draw', source } });
    } else {
      executeDrawCard(myPlayerId, source);
    }
  };

  const executeDrawCard = (playerId, source) => {
    let drawnCard = null;
    let nextDeck = [...deck];
    let nextDiscard = [...discardPile];

    if (source === 'deck') {
      if (nextDeck.length === 0) {
        if (nextDiscard.length > 1) {
          const currentTop = nextDiscard[nextDiscard.length - 1];
          nextDeck = shuffle(nextDiscard.slice(0, -1));
          nextDiscard = [currentTop];
          logAction('Reshuffled discard pile into draw deck.');
        } else {
          return;
        }
      }
      drawnCard = nextDeck.pop();
      logAction(`Player ${playerId.replace('p', '')} drew from Deck.`);
    } else {
      if (nextDiscard.length === 0) return;
      drawnCard = nextDiscard.pop();
      logAction(`Player ${playerId.replace('p', '')} drew open card: ${drawnCard.name}.`);
    }

    const nextHands = { ...playerHands };
    nextHands[playerId] = [...nextHands[playerId], drawnCard];

    setDeck(nextDeck);
    setDiscardPile(nextDiscard);
    setPlayerHands(nextHands);
    setNewlyDrawnCardId(drawnCard.id);
    if (playerId === myPlayerId) setSelectedCardId(drawnCard.id);
    setTurnPhase('discard');

    const nextState = {
      deck: nextDeck,
      discardPile: nextDiscard,
      playerHands: nextHands,
      activePlayer,
      turnPhase: 'discard',
      newlyDrawnCardId: drawnCard.id,
      winner: null
    };
    broadcastState(nextState);
  };

  const discardCard = (cardId) => {
    if (activePlayer !== myPlayerId || turnPhase !== 'discard') return;

    if (myRole === 'guest' && hostConnRef.current) {
      hostConnRef.current.send({ type: 'action', actionData: { action: 'discard', cardId } });
    } else {
      executeDiscardCard(myPlayerId, cardId);
    }
  };

  const executeDiscardCard = (playerId, cardId) => {
    const hand = playerHands[playerId];
    const cardToDiscard = hand.find(c => c.id === cardId);
    if (!cardToDiscard) return;

    const nextHand = hand.filter(c => c.id !== cardId);
    const nextDiscard = [...discardPile, cardToDiscard];
    const nextActivePlayer = getNextPlayer(playerId);

    const nextHands = { ...playerHands, [playerId]: nextHand };

    setPlayerHands(nextHands);
    setDiscardPile(nextDiscard);
    if (playerId === myPlayerId) {
      setSelectedCardId(null);
    }
    setNewlyDrawnCardId(null);

    if (checkWinCondition(nextHand)) {
      setWinner(playerId);
      setGameState('game_over');
      logAction(`🏆 Player ${playerId.replace('p', '')} declared win!`);

      const winState = {
        deck,
        discardPile: nextDiscard,
        playerHands: nextHands,
        activePlayer: nextActivePlayer,
        turnPhase: 'draw',
        newlyDrawnCardId: null,
        winner: playerId
      };
      broadcastState(winState);
      return;
    }

    setTurnPhase('draw');
    setActivePlayer(nextActivePlayer);
    logAction(`Player ${playerId.replace('p', '')} discarded ${cardToDiscard.name}.`);

    const nextState = {
      deck,
      discardPile: nextDiscard,
      playerHands: nextHands,
      activePlayer: nextActivePlayer,
      turnPhase: 'draw',
      newlyDrawnCardId: null,
      winner: null
    };
    broadcastState(nextState);
  };

  useEffect(() => {
    if (gameMode === 'pc' && activePlayer !== 'p1' && gameState === 'playing') {
      setIsPcThinking(true);
      setPcStatus(`Player ${activePlayer.replace('p', '')} Thinking...`);

      const timerDraw = setTimeout(() => {
        const topDiscard = discardPile[discardPile.length - 1];
        let drawnCard = null;
        let nextDeck = [...deck];
        let nextDiscard = [...discardPile];
        const pcHand = playerHands[activePlayer];
        let nextPcHand = [...pcHand];

        const uniquePcRanks = new Set(pcHand.filter(c => !c.isJoker).map(c => c.rank));

        if (topDiscard && (topDiscard.isJoker || !uniquePcRanks.has(topDiscard.rank))) {
          drawnCard = nextDiscard.pop();
          setPcStatus(`Player ${activePlayer.replace('p', '')} drew ${topDiscard.name} from Discard.`);
          logAction(`Player ${activePlayer.replace('p', '')} drew open card: ${topDiscard.name}.`);
        } else {
          if (nextDeck.length === 0) {
            if (nextDiscard.length > 1) {
              const currentTop = nextDiscard[nextDiscard.length - 1];
              nextDeck = shuffle(nextDiscard.slice(0, -1));
              nextDiscard = [currentTop];
              logAction('Deck exhausted. Reshuffled discard pile.');
            } else {
              logAction(`No cards left for Player ${activePlayer.replace('p', '')} to draw!`);
              setIsPcThinking(false);
              setActivePlayer(getNextPlayer(activePlayer));
              setTurnPhase('draw');
              return;
            }
          }
          drawnCard = nextDeck.pop();
          setPcStatus(`Player ${activePlayer.replace('p', '')} drew from the Deck.`);
          logAction(`Player ${activePlayer.replace('p', '')} drew a card from the deck.`);
        }

        nextPcHand.push(drawnCard);

        setDeck(nextDeck);
        setDiscardPile(nextDiscard);
        setPlayerHands(prev => ({ ...prev, [activePlayer]: nextPcHand }));

        const timerDiscard = setTimeout(() => {
          const cardToDiscard = evaluatePcDiscard(nextPcHand);
          const finalPcHand = nextPcHand.filter(c => c.id !== cardToDiscard.id);

          setPlayerHands(prev => ({ ...prev, [activePlayer]: finalPcHand }));
          const finalDiscardPile = [...nextDiscard, cardToDiscard];
          setDiscardPile(finalDiscardPile);

          logAction(`Player ${activePlayer.replace('p', '')} discarded: ${cardToDiscard.name}.`);
          setPcStatus(`Waiting for your turn...`);
          setIsPcThinking(false);

          if (checkWinCondition(finalPcHand)) {
            setTimeout(() => {
              setWinner(activePlayer);
              setGameState('game_over');
              logAction(`💻 Player ${activePlayer.replace('p', '')} declared victory!`);
            }, 1000);
          } else {
            setActivePlayer(getNextPlayer(activePlayer));
            setTurnPhase('draw');
          }
        }, 1500);

        return () => clearTimeout(timerDiscard);
      }, 1500);

      return () => clearTimeout(timerDraw);
    }
  }, [activePlayer, playerHands, deck, discardPile, gameState, gameMode, numPlayers]);

  const [draggedCardId, setDraggedCardId] = useState(null);

  const handleDragStart = (e, cardId) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedCardId && draggedCardId !== targetId) {
      const hand = [...playerHands[myPlayerId]];
      const draggedIndex = hand.findIndex(c => c.id === draggedCardId);
      const targetIndex = hand.findIndex(c => c.id === targetId);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const temp = hand[draggedIndex];
        hand[draggedIndex] = hand[targetIndex];
        hand[targetIndex] = temp;
        setPlayerHands(prev => ({ ...prev, [myPlayerId]: hand }));
        if (myRole === 'guest' && hostConnRef.current) {
          hostConnRef.current.send({ type: 'action', actionData: { action: 'reorder', newHand: hand } });
        } else if (myRole === 'host') {
          broadcastState({ deck, discardPile, playerHands: { ...playerHands, [myPlayerId]: hand }, activePlayer, turnPhase, newlyDrawnCardId, winner });
        }
      }
    }
    setDraggedCardId(null);
  };

  const isMyTurn = (activePlayer === myPlayerId);
  const myHand = playerHands[myPlayerId] || [];

  const seqStats = getHandSequenceMapping(myHand);
  const selectedDiscardCard = myHand.find(c => c.id === selectedCardId);

  const quitToMainMenu = () => {
    if (window.confirm('Are you sure you want to quit the current game?')) {
      cleanupPeer();
      setGameState('welcome');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">

      {gameState === 'welcome' && (
        <WelcomeScreen
          onStartPc={startPcGame}
          onCreatePvp={createPvpLobby}
          onJoinPvp={joinPvpLobby}
          onStartPvpGame={myRole === 'host' && connectedGuests === numPlayers - 1 ? startPvpGame : null}
          connectionState={connectionState}
          roomCode={roomCode}
          connectedGuests={connectedGuests}
          expectedGuests={numPlayers - 1}
        />
      )}

      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col justify-between p-2 md:p-4 relative max-w-7xl mx-auto w-full z-10 overflow-hidden">

          <div className="flex justify-between items-center bg-slate-900/80 p-2 md:p-3 rounded-xl border border-slate-800 shadow-md">
            <h2 className="font-black text-sm md:text-xl tracking-wider bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
              ROYAL SEQUENCE {gameMode === 'pvp' && <span className="text-xs text-indigo-400 ml-1 font-bold">(MULTIPLAYER)</span>}
            </h2>

            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={() => setShowRules(true)}
                className="px-1.5 py-1 sm:px-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] md:text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Rules
              </button>

              {gameMode === 'pvp' && (
                <div className="relative">
                  <button
                    onClick={() => setShowQuickChat(!showQuickChat)}
                    className="px-1.5 py-1 sm:px-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] md:text-xs font-black rounded-lg border border-indigo-500 text-slate-100 transition cursor-pointer"
                  >
                    <span className="hidden sm:inline">Chat </span>💬
                  </button>

                  {showQuickChat && (
                    <div className="absolute right-0 top-9 bg-slate-900 border border-slate-800 p-2 rounded-xl shadow-2xl z-50 w-48 grid grid-cols-1 gap-1">
                      {QUICK_CHAT_OPTIONS.map((phrase, idx) => (
                        <button
                          key={idx}
                          onClick={() => { broadcastChat(myPlayerId, phrase); setShowQuickChat(false); }}
                          className="w-full text-left text-xs text-slate-300 hover:bg-slate-800 p-1.5 rounded transition font-bold"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowLogs(!showLogs)}
                className={`px-1.5 py-1 sm:px-2 sm:py-1.5 text-[10px] md:text-xs font-semibold rounded-lg border transition cursor-pointer ${showLogs ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'}`}
              >
                Logs
              </button>
              <button
                onClick={quitToMainMenu}
                className="px-1.5 py-1 sm:px-2 sm:py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-[10px] md:text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Quit
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-b from-emerald-900/95 to-emerald-950/95 rounded-[1.5rem] border-4 border-amber-950/80 shadow-[inset_0_4px_30px_rgba(0,0,0,0.7),0_10px_35px_rgba(0,0,0,0.5)] p-3 md:p-5 flex flex-col justify-between relative overflow-hidden my-3 min-h-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Top Area: Opponents list & turn indicator */}
            <div className="flex justify-center items-start gap-4 z-10 relative mt-2">
              {[...Array(numPlayers)].map((_, i) => {
                const pId = `p${i + 1}`;
                if (pId === myPlayerId) return null; // Don't show myself here

                const isOpponentTurn = activePlayer === pId;
                const handSize = playerHands[pId]?.length || 0;
                const chatMsg = chatMessages[pId];

                return (
                  <div key={pId} className={`flex flex-col items-center gap-1 transition-all ${isOpponentTurn ? 'scale-110 opacity-100' : 'scale-90 opacity-60'}`}>
                    {chatMsg && (
                      <div className="absolute -bottom-8 bg-white text-slate-900 px-2 py-1 rounded text-[10px] font-bold shadow-lg animate-bounce z-[9999] whitespace-nowrap">
                        {chatMsg}
                      </div>
                    )}
                    <div className={`px-3 py-1 rounded-full border text-[10px] md:text-xs flex items-center gap-2 ${isOpponentTurn ? 'bg-amber-500/20 border-amber-500 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}>
                      {isOpponentTurn && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-400"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                      <span className="font-bold">{gameMode === 'pc' ? 'Computer' : 'Player'} {i + 1}</span>
                    </div>
                    {/* Small visual card icon for hand */}
                    <div className="relative mt-1">
                      <div className="w-8 h-12 card-back-pattern-red rounded shadow-md border-[1.5px] border-slate-200"></div>
                      <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                        {handSize}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <SequenceTracker
              mapping={seqStats.mapping}
              redundantCards={seqStats.redundantCards}
              unusedJokers={seqStats.unusedJokers}
            />

            <div className="my-2 flex justify-center items-center gap-6 md:gap-14 z-10 relative flex-1 min-h-0">
              <div className="flex flex-col items-center gap-1.5 scale-90 sm:scale-100">
                <button
                  onClick={() => drawCard('deck')}
                  disabled={!isMyTurn || turnPhase !== 'draw'}
                  className={`playing-card-wrapper card-back-pattern deck-stack-depth flex items-center justify-center border-4 border-white select-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${isMyTurn && turnPhase === 'draw' ? 'glow-active-zone border-blue-500 cursor-pointer' : ''}`}
                >
                  <div className="bg-slate-950/60 backdrop-blur-sm rounded-lg px-1.5 py-0.5 text-center font-black text-[10px] md:text-xs text-slate-100 shadow border border-slate-800">
                    DECK
                    <div className="text-[9px] text-emerald-400 font-bold">{deck.length}</div>
                  </div>
                </button>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-300 tracking-wider">DRAW DECK</span>
              </div>

              <div className="flex flex-col items-center justify-center max-w-sm text-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/85 backdrop-blur-md shadow-xl min-w-[170px] sm:min-w-[250px] scale-90 sm:scale-100">
                <span className="text-[9px] font-bold text-slate-400 tracking-wide uppercase mb-1">Table Actions</span>

                {isMyTurn && turnPhase === 'draw' && (
                  <p className="text-xs text-blue-400 font-bold animate-pulse px-1 leading-snug">
                    Draw from Deck or Discard pile!
                  </p>
                )}

                {isMyTurn && turnPhase === 'discard' && (
                  <div className="space-y-2 w-full px-1">
                    <p className="text-[10px] text-amber-400 font-bold truncate">
                      {selectedDiscardCard ? `Selected: ${selectedDiscardCard.name}` : "Select a card in your hand to discard."}
                    </p>
                    {selectedCardId ? (
                      <button
                        onClick={() => discardCard(selectedCardId)}
                        className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-lg shadow-[0_2px_10px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all text-[10px] tracking-wide uppercase cursor-pointer"
                      >
                        Discard Card
                      </button>
                    ) : (
                      <div className="py-1.5 bg-slate-900/60 text-slate-500 font-bold rounded-lg border border-slate-850 border-dashed text-[10px] uppercase select-none">
                        No Card Selected
                      </div>
                    )}
                  </div>
                )}

                {!isMyTurn && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Opponent's turn...</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-1.5 scale-90 sm:scale-100">
                <button
                  onClick={() => drawCard('discard')}
                  disabled={!isMyTurn || turnPhase !== 'draw' || discardPile.length === 0}
                  className={`playing-card-wrapper bg-slate-900 border-2 border-slate-700/60 shadow-lg flex items-center justify-center relative select-none disabled:opacity-40 disabled:cursor-not-allowed ${isMyTurn && turnPhase === 'draw' && discardPile.length > 0 ? 'glow-active-zone cursor-pointer border-blue-500' : ''}`}
                >
                  {discardPile.length > 0 ? (
                    <img
                      src={discardPile[discardPile.length - 1].svg}
                      alt={discardPile[discardPile.length - 1].name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-slate-650 font-bold text-center text-[10px] px-1.5 border border-dashed border-slate-800 rounded-lg py-5">
                      Empty
                    </div>
                  )}
                  {discardPile.length > 0 && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-slate-950/70 border border-slate-800 rounded text-[8px] text-slate-300 font-bold">
                      Open
                    </span>
                  )}
                </button>
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 tracking-wider">DISCARD PILE</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 z-10 relative">
            <div className="w-full flex justify-between items-center px-1">
              <div className="flex gap-1.5">
                <button
                  onClick={() => handlePlayerSort('rank')}
                  className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-[9px] md:text-xs font-bold rounded-lg border border-slate-800 text-slate-300 transition cursor-pointer"
                >
                  Sort Rank
                </button>
                <button
                  onClick={() => handlePlayerSort('suit')}
                  className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-[9px] md:text-xs font-bold rounded-lg border border-slate-800 text-slate-300 transition cursor-pointer"
                >
                  Sort Suit
                </button>
              </div>

              <div className="text-[9px] md:text-xs text-slate-400 font-medium bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                {isMyTurn && turnPhase === 'discard' ? (
                  <span className="text-amber-400 font-bold">💡 Double-tap card to discard it</span>
                ) : (
                  <span>💡 Drag cards to rearrange them</span>
                )}
              </div>
            </div>

            <div className="card-hand-container px-2">
              <ChatBubble message={chatMessages[myPlayerId]} onClear={() => setChatMessages(prev => ({ ...prev, [myPlayerId]: null }))} />

              {myHand.map((card, index) => (
                <Card
                  key={card.id}
                  card={card}
                  index={index}
                  totalCards={myHand.length}
                  isSelected={selectedCardId === card.id}
                  isNewlyDrawn={card.id === newlyDrawnCardId}
                  turnState={isMyTurn ? (turnPhase === 'discard' ? 'player_discard' : 'player_draw') : 'opponent_turn'}
                  onSelect={setSelectedCardId}
                  onDiscard={discardCard}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </div>

          {showLogs && <GameLogs logs={gameLogs} onClose={() => setShowLogs(false)} />}
          {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        </div>
      )}

      {gameState === 'game_over' && (
        <GameOverScreen
          winner={winner}
          myPlayerId={myPlayerId}
          playerHands={playerHands}
          isPvp={gameMode === 'pvp'}
          isHost={myRole === 'host'}
          onRestart={gameMode === 'pvp' ? () => {
            if (myRole === 'host') startPvpGame();
          } : () => startPcGame(numPlayers)}
          onMainMenu={quitToMainMenu}
        />
      )}
    </div>
  );
}
