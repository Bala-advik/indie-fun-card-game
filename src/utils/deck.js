// Card Constants
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

export const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

export const SUIT_COLORS = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-200',
  spades: 'text-slate-200'
};

// Get numerical value for rank sorting
export function getRankValue(rank) {
  switch (rank) {
    case 'A': return 1;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'Joker': return 99;
    default: return parseInt(rank, 10);
  }
}

// Generate a fresh 108-card deck (2 standard decks + 4 jokers)
export function create108Deck() {
  const deck = [];
  let idCounter = 0;

  // Add 2 decks of 52 cards
  for (let deckNum = 0; deckNum < 2; deckNum++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let fileNameRank = rank;
        if (rank === 'A') fileNameRank = 'ace';
        else if (rank === 'J') fileNameRank = 'jack';
        else if (rank === 'Q') fileNameRank = 'queen';
        else if (rank === 'K') fileNameRank = 'king';

        const name = `${rank} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
        const svg = `/svgs/${fileNameRank}_of_${suit}.svg`;

        deck.push({
          id: `c_${deckNum}_${suit}_${rank}_${idCounter++}`,
          suit,
          rank,
          value: getRankValue(rank),
          isJoker: false,
          name,
          svg
        });
      }
    }
  }

  // Add 4 Jokers (2 red, 2 black)
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `joker_red_${i}`,
      suit: 'none',
      rank: 'Joker',
      value: 99,
      isJoker: true,
      name: 'Red Joker',
      svg: '/svgs/joker_red.svg'
    });
    deck.push({
      id: `joker_black_${i}`,
      suit: 'none',
      rank: 'Joker',
      value: 99,
      isJoker: true,
      name: 'Black Joker',
      svg: '/svgs/joker_black.svg'
    });
  }

  return deck;
}

// Shuffle implementation (Fisher-Yates)
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Check if a 13-card hand wins
// Rule: Win if all non-joker cards have unique ranks.
export function checkWinCondition(hand) {
  if (hand.length !== 13) return false;
  const nonJokers = hand.filter(c => !c.isJoker);
  const ranks = nonJokers.map(c => c.rank);
  const uniqueRanks = new Set(ranks);
  return uniqueRanks.size === nonJokers.length;
}

// Map player's hand to the 13 rank slots to show progress
export function getHandSequenceMapping(hand) {
  const mapping = {};
  const usedCardIds = new Set();
  const jokers = hand.filter(c => c.isJoker);
  let jokerIndex = 0;

  // First pass: match exact ranks
  for (const rank of RANKS) {
    const matchingCard = hand.find(c => !c.isJoker && c.rank === rank && !usedCardIds.has(c.id));
    if (matchingCard) {
      mapping[rank] = { matched: true, card: matchingCard, isWildcard: false };
      usedCardIds.add(matchingCard.id);
    } else {
      mapping[rank] = { matched: false, card: null, isWildcard: false };
    }
  }

  // Second pass: fill in empty ranks with Jokers if available
  for (const rank of RANKS) {
    if (!mapping[rank].matched && jokerIndex < jokers.length) {
      mapping[rank] = {
        matched: true,
        card: jokers[jokerIndex],
        isWildcard: true,
        wildcardRank: rank
      };
      jokerIndex++;
    }
  }

  const redundantCards = hand.filter(c => !usedCardIds.has(c.id) && !c.isJoker);
  const unusedJokers = jokers.slice(jokerIndex);

  return {
    mapping,
    redundantCards,
    unusedJokers,
    isWin: Object.values(mapping).every(slot => slot.matched)
  };
}

// Sorting handlers
export function sortHandByRank(hand) {
  return [...hand].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    if (a.isJoker && b.isJoker) return a.name.localeCompare(b.name);
    
    if (a.value !== b.value) {
      return a.value - b.value;
    }
    return a.suit.localeCompare(b.suit);
  });
}

export function sortHandBySuit(hand) {
  return [...hand].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    if (a.isJoker && b.isJoker) return a.name.localeCompare(b.name);
    
    if (a.suit !== b.suit) {
      return a.suit.localeCompare(b.suit);
    }
    return a.value - b.value;
  });
}

// PC AI discard assistant
export function evaluatePcDiscard(hand) {
  const nonJokers = hand.filter(c => !c.isJoker);
  
  // Count rank frequencies
  const rankCounts = {};
  for (const card of nonJokers) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }

  // Find duplicates (cards whose ranks appear more than once)
  const duplicates = nonJokers.filter(c => rankCounts[c.rank] > 1);
  
  if (duplicates.length > 0) {
    // Discard the first duplicate rank card found
    return duplicates[0];
  }

  // If no duplicates, PC holds Jokers and unique ranks. It must have 14 cards.
  // That means PC has some Jokers and all unique ranks (which is a winning state if 1 card is discarded).
  // Discard any Joker if we have multiple, or discard the highest rank card that isn't a joker
  const jokers = hand.filter(c => c.isJoker);
  if (jokers.length > 1) {
    return jokers[0];
  }

  // Otherwise, discard the card with the highest value to be safe
  const sortedNonJokers = [...nonJokers].sort((a, b) => b.value - a.value);
  return sortedNonJokers[0];
}
