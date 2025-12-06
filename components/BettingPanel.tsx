import React, { useState } from 'react';
import { GameState, Bet, Team } from '../types';
import { Coins, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface BettingPanelProps {
  gameState: GameState;
  wallet: number;
  bets: Bet[];
  onPlaceBet: (type: Bet['type'], amount: number, odds: number) => void;
}

const BettingPanel: React.FC<BettingPanelProps> = ({ gameState, wallet, bets, onPlaceBet }) => {
  const [wager, setWager] = useState(100);

  const OddsButton = ({ label, type, odds }: { label: string, type: Bet['type'], odds: number }) => (
    <button 
      onClick={() => onPlaceBet(type, wager, odds)}
      disabled={wallet < wager || gameState.status === 'FINISHED'}
      className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-500 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"/>
      <span className="text-slate-400 text-xs uppercase font-bold tracking-wider relative z-10">{label}</span>
      <span className={`text-xl font-mono font-bold relative z-10 ${odds > 2.0 ? 'text-green-400' : 'text-white'}`}>
        x{odds.toFixed(2)}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-80 md:w-96">
      
      {/* Header / Wallet */}
      <div className="p-4 bg-slate-950 border-b border-slate-800">
        <h2 className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
            <Coins size={20} />
            Degenerate Bets
        </h2>
        <div className="flex justify-between items-end">
            <div className="text-3xl font-mono text-white font-bold flex items-center">
                <span className="text-green-500 mr-1">$</span>
                {wallet.toFixed(0)}
            </div>
            <div className="text-xs text-slate-500 uppercase">Available Balance</div>
        </div>
      </div>

      {/* Live Odds Board */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
            <h3 className="text-slate-400 text-sm font-bold uppercase mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Live Odds
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <OddsButton label={gameState.homeTeam.name} type="HOME_WIN" odds={gameState.odds.homeWin} />
                <OddsButton label={gameState.awayTeam.name} type="AWAY_WIN" odds={gameState.odds.awayWin} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <OddsButton label="Over Points" type="OVER" odds={gameState.odds.overUnder} />
                <OddsButton label="Under Points" type="UNDER" odds={gameState.odds.overUnder} />
            </div>
        </div>

        {/* Wager Input */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Wager Amount</label>
            <div className="flex items-center gap-2">
                <button onClick={() => setWager(Math.max(10, wager - 50))} className="p-2 bg-slate-700 rounded text-white font-bold hover:bg-slate-600">-</button>
                <div className="flex-1 bg-slate-950 rounded p-2 text-center font-mono text-xl text-yellow-400 border border-slate-700">
                    ${wager}
                </div>
                <button onClick={() => setWager(wager + 50)} className="p-2 bg-slate-700 rounded text-white font-bold hover:bg-slate-600">+</button>
            </div>
        </div>

        {/* Active Bets History */}
        <div>
            <h3 className="text-slate-400 text-sm font-bold uppercase mb-3 flex items-center gap-2">
                <DollarSign size={16} /> Active Slips
            </h3>
            <div className="space-y-2">
                {bets.length === 0 && <div className="text-slate-600 text-center text-sm italic py-4">No active bets</div>}
                {bets.map(bet => (
                    <div key={bet.id} className={`p-3 rounded border text-sm flex justify-between items-center ${
                        bet.status === 'PENDING' ? 'bg-slate-800 border-slate-700' :
                        bet.status === 'WON' ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'
                    }`}>
                        <div>
                            <div className="font-bold text-slate-200">{bet.type.replace('_', ' ')}</div>
                            <div className="text-xs text-slate-500">Odds: {bet.odds}</div>
                        </div>
                        <div className={`font-mono font-bold ${
                             bet.status === 'WON' ? 'text-green-400' : bet.status === 'LOST' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                            {bet.status === 'PENDING' ? `$${bet.amount}` : bet.status === 'WON' ? `+$${(bet.amount * bet.odds).toFixed(0)}` : `-$${bet.amount}`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BettingPanel;
