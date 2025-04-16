/**
 * Scrambles the order of words while preserving their associated data
 * @param {Array} words - Array of word objects with properties like word, article, translation, etc.
 * @returns {Array} - New array with scrambled words
 */
export const scrambleWords = (words) => {
  // Create a copy of the array to avoid mutating the original
  const scrambledWords = [...words];
  
  // Fisher-Yates shuffle algorithm
  for (let i = scrambledWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scrambledWords[i], scrambledWords[j]] = [scrambledWords[j], scrambledWords[i]];
  }
  
  return scrambledWords;
}; 