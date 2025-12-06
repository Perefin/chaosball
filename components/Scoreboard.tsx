import React from 'react';
import { GameState } from '../types';

interface ScoreboardProps {
  gameState: GameState;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ gameState }) => {
  return (
    <div className="bg-slate-900 border-b-4 border-slate-800 p-4 shadow-lg flex items-center justify-between sticky top-0 z-50">
        
        {/* Home Team */}
        <div className="flex items-center gap-4 flex-1">
            <div className="text-right flex-1">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">{gameState.homeTeam.name}</h2>
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">{gameState.homeTeam.mascot}</span>
            </div>
            <div className="bg-black text-yellow-400 font-mono text-4xl px-4 py-2 rounded border border-slate-700 min-w-[80px] text-center shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                {gameState.homeScore}
            </div>
        </div>

        {/* Timer / Info */}
        <div className="px-8 flex flex-col items-center">
            <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
                Q{gameState.quarter}
            </div>
            <div className="font-mono text-2xl text-white font-bold tracking-widest">
                {gameState.timeRemaining}
            </div>
            <div className="text-[10px] text-slate-500 uppercase mt-1">
                Possession: <span className={gameState.possession === 'home' ? 'text-cyan-400' : 'text-red-400'}>{gameState.possession === 'home' ? 'HOME' : 'AWAY'}</span>
            </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-4 flex-1">
            <div className="bg-black text-yellow-400 font-mono text-4xl px-4 py-2 rounded border border-slate-700 min-w-[80px] text-center shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                {gameState.awayScore}
            </div>
            <div className="text-left flex-1">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">{gameState.awayTeam.name}</h2>
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">{gameState.awayTeam.mascot}</span>
            </div>
        </div>
    </div>
  );
};

export default Scoreboard;
