// Fuzzy search utility for product name autocomplete
import { normalizedSuggestions, normalizeString } from '../data/productSuggestions';

export interface SearchResult {
  suggestion: string;
  score: number;
  matchIndex: number;
}

// Calculate similarity score between query and suggestion
const calculateScore = (normalizedQuery: string, normalizedSuggestion: string): number => {
  // Exact match gets highest score
  if (normalizedQuery === normalizedSuggestion) return 100;
  
  // Check if query is at the beginning of suggestion (prefix match)
  if (normalizedSuggestion.startsWith(normalizedQuery)) {
    return 90 - (normalizedSuggestion.length - normalizedQuery.length) * 2;
  }
  
  // Check if query is contained within suggestion
  const matchIndex = normalizedSuggestion.indexOf(normalizedQuery);
  if (matchIndex !== -1) {
    // Score based on position and length difference
    const positionPenalty = matchIndex * 5;
    const lengthPenalty = (normalizedSuggestion.length - normalizedQuery.length) * 2;
    return Math.max(0, 80 - positionPenalty - lengthPenalty);
  }
  
  // Fuzzy matching for partial character matches
  let score = 0;
  let queryIndex = 0;
  let suggestionIndex = 0;
  
  while (queryIndex < normalizedQuery.length && suggestionIndex < normalizedSuggestion.length) {
    if (normalizedQuery[queryIndex] === normalizedSuggestion[suggestionIndex]) {
      score += 2;
      queryIndex++;
    } else {
      score -= 1;
    }
    suggestionIndex++;
  }
  
  // Bonus for matching all query characters
  if (queryIndex === normalizedQuery.length) {
    score += 10;
  }
  
  // Penalty for length difference
  score -= Math.abs(normalizedQuery.length - normalizedSuggestion.length);
  
  return Math.max(0, score);
};

// Search for suggestions matching the query
export const searchSuggestions = (query: string, maxResults: number = 10): SearchResult[] => {
  if (!query.trim()) return [];
  
  const normalizedQuery = normalizeString(query);
  const results: SearchResult[] = [];
  
  for (const { original, normalized } of normalizedSuggestions) {
    const score = calculateScore(normalizedQuery, normalized);
    
    if (score > 0) {
      results.push({
        suggestion: original,
        score,
        matchIndex: normalized.indexOf(normalizedQuery)
      });
    }
  }
  
  // Sort by score (descending) and return top results
  return results
    .sort((a, b) => {
      // Primary sort: by score
      if (b.score !== a.score) return b.score - a.score;
      
      // Secondary sort: by match position (earlier matches first)
      if (a.matchIndex !== b.matchIndex) return a.matchIndex - b.matchIndex;
      
      // Tertiary sort: by length (shorter suggestions first)
      return a.suggestion.length - b.suggestion.length;
    })
    .slice(0, maxResults);
};

// Get exact matches only (for validation)
export const getExactMatches = (query: string): string[] => {
  const normalizedQuery = normalizeString(query);
  return normalizedSuggestions
    .filter(({ normalized }) => normalized === normalizedQuery)
    .map(({ original }) => original);
};

// Check if a value is valid (exists in suggestions)
export const isValidSuggestion = (value: string): boolean => {
  return getExactMatches(value).length > 0;
};