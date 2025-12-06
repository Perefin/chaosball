export interface Team {
  name: string;
  color: string;
  mascot: string;
}

export interface GameState {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string; // e.g., "12:00"
  possession: 'home' | 'away';
  lastPlayDescription: string;
  commentary: string;
  odds: {
    homeWin: number;
    awayWin: number;
    overUnder: number;
  };
  status: 'IDLE' | 'PLAYING' | 'FINISHED';
}

export interface PlayUpdate {
  homeScoreDelta: number;
  awayScoreDelta: number;
  timeElapsedSeconds: number;
  playDescription: string;
  commentary: string;
  visualPrompt: string; // Prompt for the image generator
  isBigPlay: boolean; // Triggers Veo if true
  newOdds: {
    homeWin: number;
    awayWin: number;
    overUnder: number;
  }
}

export interface GeneratedVisual {
  type: 'image' | 'video';
  url: string;
  prompt: string;
}

export interface Bet {
  id: string;
  type: 'HOME_WIN' | 'AWAY_WIN' | 'OVER' | 'UNDER';
  amount: number;
  odds: number;
  status: 'PENDING' | 'WON' | 'LOST';
}
