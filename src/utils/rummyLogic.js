import { getRankValue } from './deck';

/**
 * Checks if a group of cards is a valid Run.
 * Run: Same suit, consecutive ranks. Length 3 or 4.
 * Jokers can substitute any rank unless isPureCheck is true.
 */
export function isValidRun(cards, isPureCheck = false) {
  if (cards.length !== 3 && cards.length !== 4) return false;

  const jokers = cards.filter(c => c.isJoker);
  if (isPureCheck && jokers.length > 0) return false;

  const nonJokers = cards.filter(c => !c.isJoker);
  if (nonJokers.length === 0) return true; // All jokers (edge case, not a pure run, but valid impure)

  // Must have the same suit
  const suit = nonJokers[0].suit;
  if (!nonJokers.every(c => c.suit === suit)) return false;

  // Sort by rank value to check consecutiveness
  const sortedNonJokers = [...nonJokers].sort((a, b) => a.value - b.value);

  const checkGaps = (cardsArr) => {
    let gapsCount = 0;
    for (let i = 0; i < cardsArr.length - 1; i++) {
      const diff = cardsArr[i + 1].value - cardsArr[i].value;
      if (diff <= 0) return Infinity; // Duplicate card or unordered
      gapsCount += diff - 1;
    }
    return gapsCount;
  };

  let minGaps = checkGaps(sortedNonJokers);

  // Allow Ace to act as High (value 14) at the end of a run (e.g. Q, K, A)
  if (sortedNonJokers[0].value === 1) {
    const aceHigh = [...sortedNonJokers];
    const ace = aceHigh.shift();
    aceHigh.push({ ...ace, value: 14 });
    minGaps = Math.min(minGaps, checkGaps(aceHigh));
  }

  return minGaps <= jokers.length;
}

/**
 * Checks if a group of cards is a valid Set.
 * Set: Same rank, different suits. Length 3 or 4.
 * Jokers can substitute the rank.
 */
export function isValidSet(cards) {
  if (cards.length !== 3 && cards.length !== 4) return false;

  const nonJokers = cards.filter(c => !c.isJoker);
  if (nonJokers.length === 0) return true; // All jokers

  // Must have the same rank
  const rank = nonJokers[0].rank;
  if (!nonJokers.every(c => c.rank === rank)) return false;

  // Must have different suits
  const suits = new Set(nonJokers.map(c => c.suit));
  if (suits.size !== nonJokers.length) return false;

  return true;
}

/**
 * Checks if a combination is valid (either a Run or a Set).
 */
export function isValidMeld(cards) {
  return isValidRun(cards, false) || isValidSet(cards);
}

/**
 * Validates if the EXACT physical arrangement of a 10-card hand satisfies the 4:3:3 win condition.
 */
export function validateArrangedRummyWin(hand) {
  if (hand.length !== 10) return { isWin: false, error: 'Hand must have exactly 10 cards.' };

  const group4 = hand.slice(0, 4);
  const group3a = hand.slice(4, 7);
  const group3b = hand.slice(7, 10);

  if (!isValidMeld(group4)) return { isWin: false, error: 'First 4 cards do not form a valid run or set.' };
  if (!isValidMeld(group3a)) return { isWin: false, error: 'Middle 3 cards do not form a valid run or set.' };
  if (!isValidMeld(group3b)) return { isWin: false, error: 'Last 3 cards do not form a valid run or set.' };

  const isGroup4Pure = isValidRun(group4, true);
  const isGroup3aPure = isValidRun(group3a, true);
  const isGroup3bPure = isValidRun(group3b, true);

  if (isGroup4Pure || isGroup3aPure || isGroup3bPure) {
    return { isWin: true, melds: [group4, group3a, group3b] };
  }

  return { isWin: false, error: 'At least one pure sequence (no jokers) is required.' };
}

/**
 * Validates if the 10-card hand satisfies the 4:3:3 win condition with at least one pure sequence, regardless of order.
 */
export function validateRummyWin(hand) {
  if (hand.length !== 10) return { isWin: false, melds: null };

  // To check all 4:3:3 partitions, we can generate all combinations.
  // A hand has 10! / (4! * 3! * 3!) partitions, but order within groups doesn't matter.
  // Let's use a backtracking approach to find a valid partitioning.
  
  // Helper to get combinations of size k from an array
  function getCombinations(array, k) {
    const results = [];
    function backtrack(start, currentCombo, usedIndices) {
      if (currentCombo.length === k) {
        const remaining = array.filter((_, idx) => !usedIndices.has(idx));
        results.push({
          combo: [...currentCombo],
          remaining
        });
        return;
      }
      for (let i = start; i < array.length; i++) {
        currentCombo.push(array[i]);
        usedIndices.add(i);
        backtrack(i + 1, currentCombo, usedIndices);
        usedIndices.delete(i);
        currentCombo.pop();
      }
    }
    backtrack(0, [], new Set());
    return results;
  }

  // 1. Pick 4 cards for the first group
  const fourCardCombos = getCombinations(hand, 4);
  
  for (const group4 of fourCardCombos) {
    if (!isValidMeld(group4.combo)) continue;

    // 2. Pick 3 cards from the remaining 6 for the second group
    const threeCardCombos = getCombinations(group4.remaining, 3);
    for (const group3 of threeCardCombos) {
      if (!isValidMeld(group3.combo)) continue;

      // 3. The remaining 3 cards form the third group
      const finalGroup3 = group3.remaining;
      if (!isValidMeld(finalGroup3)) continue;

      // Found a 4:3:3 structure where all are valid melds.
      // Now verify that AT LEAST ONE is a pure sequence.
      const isGroup4Pure = isValidRun(group4.combo, true);
      const isGroup3aPure = isValidRun(group3.combo, true);
      const isGroup3bPure = isValidRun(finalGroup3, true);

      if (isGroup4Pure || isGroup3aPure || isGroup3bPure) {
        return {
          isWin: true,
          melds: [group4.combo, group3.combo, finalGroup3]
        };
      }
    }
  }

  return { isWin: false, melds: null };
}

/**
 * Greedily attempts to sort a hand into possible melds.
 * This is an approximation used for the "Sort by Melds" feature.
 */
export function sortHandByMelds(hand) {
  let remaining = [...hand];
  const melds = [];
  
  // Very simplistic greedy approach for grouping:
  // Since finding perfect melds is computationally expensive for auto-sort without fixed structure,
  // we just group by Suit -> Rank to visually group potential runs, and then Rank for sets.
  
  // Instead of complex solving (since it's a "Sort" button, not an AI solver),
  // we just cluster the cards so similar suits and consecutive ranks sit together,
  // and identical ranks sit together.
  
  return [...hand].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    
    // Group by suit first
    if (a.suit !== b.suit) {
      return a.suit.localeCompare(b.suit);
    }
    // Then by rank
    return a.value - b.value;
  });
}
