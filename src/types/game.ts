export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '10' | 'K' | 'Q' | 'J' | '9';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: string;
  nickname: string;
  team: 'A' | 'B' | null;
  isReady: boolean;
  isHost: boolean;
  cards: Card[];
  isCurrentTurn: boolean;
}

export interface Team {
  id: 'A' | 'B';
  name: string;
  players: string[];
  score: number;
  melds: number;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  teams: {
    A: Team;
    B: Team;
  };
  settings: {
    withMusik: boolean;
  };
  status: 'waiting' | 'playing' | 'finished';
  currentTrick: Card[];
  trump: Suit | null;
  lastWinner: {
    teamName: string;
    score: number;
    date: string;
  } | null;
}

export interface GameState {
  currentPlayer: string;
  phase: 'bidding' | 'playing' | 'scoring';
  currentBid: number;
  bidWinner: string | null;
  musik: Card[];
  tricks: { winner: string; cards: Card[] }[];
}

export const CARD_POINTS: Record<Rank, number> = {
  'A': 11,
  '10': 10,
  'K': 4,
  'Q': 3,
  'J': 2,
  '9': 0,
};

export const MELD_POINTS: Record<Suit, number> = {
  'spades': 40,
  'clubs': 60,
  'diamonds': 80,
  'hearts': 100,
};
