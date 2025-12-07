import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RefreshCw, Zap, Video } from 'lucide-react';
import Scoreboard from './components/Scoreboard';
import BroadcastScreen from './components/BroadcastScreen';
import BettingPanel from './components/BettingPanel';
import { generateMatchSetup, generateNextPlay, generateKeyframe, generateCommentaryAudio, generateReplay } from './services/geminiService';
import { GameState, Bet, GeneratedVisual, Team } from './types';

// Declare global AI Studio types
// We augment the global AIStudio interface instead of redeclaring window.aistudio
// to avoid conflicts with existing definitions in the environment.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const INITIAL_STATE: GameState = {
  id: 'match-1',
  homeTeam: { name: 'Cyber', color: 'blue', mascot: 'Droids' },
  awayTeam: { name: 'Terra', color: 'red', mascot: 'Titans' },
  homeScore: 0,
  awayScore: 0,
  quarter: 1,
  timeRemaining: '15:00',
  possession: 'home',
  lastPlayDescription: 'Match starting...',
  commentary: 'Welcome to ChaosBall!',
  odds: { homeWin: 1.9, awayWin: 1.9, overUnder: 1.9 },
  status: 'IDLE'
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [visual, setVisual] = useState<GeneratedVisual | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wallet, setWallet] = useState(1000);
  const [bets, setBets] = useState<Bet[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [veoLoading, setVeoLoading] = useState(false);

  // Audio Context for TTS
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check API Key Selection on Mount
  useEffect(() => {
    const checkKey = async () => {
      // 1. Check Local Env
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        setHasApiKey(true);
        return;
      }
      // 2. Check AI Studio (if available)
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const playAudio = async (buffer: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const audioBuffer = await ctx.decodeAudioData(buffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
  };

  const initializeMatch = async () => {
    setIsProcessing(true);
    try {
      const setup = await generateMatchSetup("Cyberpunk Robot Basketball");
      setGameState(prev => ({
        ...prev,
        homeTeam: setup.home,
        awayTeam: setup.away,
        status: 'PLAYING',
        commentary: `We are live from ${setup.venue}! ${setup.home.name} taking on ${setup.away.name}.`
      }));

      // Initial Visual
      const img = await generateKeyframe(`Wide shot of futuristic sports arena, ${setup.venue}, crowds cheering, neon lights.`);
      setVisual({ type: 'image', url: img, prompt: 'Arena View' });

    } catch (e) {
      console.error(e);
      alert("Failed to initialize match. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const nextPlay = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Generate Logic
      const update = await generateNextPlay(gameState);

      // 2. Update State immediatley with text
      setGameState(prev => {
        // Simple time decrement logic
        const [min, sec] = prev.timeRemaining.split(':').map(Number);
        let totalSec = min * 60 + sec - update.timeElapsedSeconds;
        if (totalSec < 0) totalSec = 0;
        const newMin = Math.floor(totalSec / 60);
        const newSec = totalSec % 60;
        const timeStr = `${newMin}:${newSec.toString().padStart(2, '0')}`;

        return {
          ...prev,
          homeScore: prev.homeScore + update.homeScoreDelta,
          awayScore: prev.awayScore + update.awayScoreDelta,
          timeRemaining: timeStr,
          lastPlayDescription: update.playDescription,
          commentary: update.commentary,
          odds: update.newOdds,
          possession: prev.possession === 'home' ? 'away' : 'home', // toggle possession
        };
      });

      // 3. Kick off Parallel Tasks: Image & Audio
      const visualPromise = generateKeyframe(update.visualPrompt);
      const audioPromise = generateCommentaryAudio(update.commentary);

      // 4. Resolve Image & Audio
      const [imgUrl, audioBuffer] = await Promise.all([visualPromise, audioPromise]);

      setVisual({ type: 'image', url: imgUrl, prompt: update.visualPrompt });
      playAudio(audioBuffer);

      // 5. Check Betting Outcomes
      resolveBets(update.homeScoreDelta, update.awayScoreDelta, update.newOdds);

    } catch (e) {
      console.error("Play generation failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveBets = (hDelta: number, aDelta: number, odds: any) => {
    // Simple resolution logic for demo purposes
    // In a real app, this would be complex.
    // Here we just randomly resolve pending bets if a score happens to simulate excitement
    if (hDelta > 0 || aDelta > 0) {
      setBets(prev => prev.map(bet => {
        if (bet.status !== 'PENDING') return bet;
        // Very dumb logic: 10% chance to resolve on any score event just for demo flow
        if (Math.random() > 0.9) {
          const won = Math.random() > 0.5;
          if (won) setWallet(w => w + (bet.amount * bet.odds));
          return { ...bet, status: won ? 'WON' : 'LOST' };
        }
        return bet;
      }));
    }
  };

  const handlePlaceBet = (type: Bet['type'], amount: number, odds: number) => {
    const newBet: Bet = {
      id: Date.now().toString(),
      type,
      amount,
      odds,
      status: 'PENDING'
    };
    setWallet(prev => prev - amount);
    setBets(prev => [newBet, ...prev]);
  };

  const triggerInstantReplay = async () => {
    if (!visual?.prompt) return;
    if (veoLoading) return;

    setVeoLoading(true);
    try {
      const videoUri = await generateReplay(visual.prompt);
      setVisual({ type: 'video', url: videoUri, prompt: visual.prompt });
    } catch (e) {
      console.error("Replay failed", e);
      alert("Replay generation failed (check console/API key quota)");
    } finally {
      setVeoLoading(false);
    }
  }

  // Render Key Selection Screen if needed
  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-cyan-400 font-mono">CHAOSBALL NETWORK</h1>
        <p className="max-w-md mb-8 text-slate-400">
          Access requires a paid API key for Veo video generation.
          <br /><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline text-cyan-600">Billing Docs</a>
        </p>
        <button
          onClick={handleSelectKey}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow-[0_0_20px_rgba(8,145,178,0.5)] transition-all"
        >
          Select API Key to Enter
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-white">
      {/* 1. Top Scoreboard */}
      <Scoreboard gameState={gameState} />

      {/* 2. Main Content Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Broadcast Area */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto">

          <div className="w-full max-w-5xl mb-6">
            <BroadcastScreen
              visual={visual}
              isLoading={isProcessing && !visual?.url}
              onScreenText={gameState.commentary}
            />
          </div>

          {/* Game Controls */}
          <div className="flex gap-4 mb-8">
            {gameState.status === 'IDLE' ? (
              <button
                onClick={initializeMatch}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-8 py-4 rounded font-bold text-xl uppercase shadow-lg disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="animate-spin" /> : <Play />}
                Initialize Match
              </button>
            ) : (
              <>
                <button
                  onClick={nextPlay}
                  disabled={isProcessing || veoLoading}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded font-bold text-xl uppercase shadow-[0_0_15px_rgba(234,179,8,0.4)] disabled:opacity-50 transition-all active:scale-95"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" /> : <Zap fill="black" />}
                  Run Next Play
                </button>

                <button
                  onClick={triggerInstantReplay}
                  disabled={isProcessing || veoLoading || !visual}
                  className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 px-6 py-4 rounded font-bold text-lg uppercase shadow-lg disabled:opacity-50 disabled:grayscale transition-all"
                >
                  {veoLoading ? <RefreshCw className="animate-spin" /> : <Video />}
                  Generate Replay (Veo)
                </button>
              </>
            )}
          </div>

          {/* Status Log */}
          <div className="w-full max-w-4xl bg-slate-900 rounded p-4 border border-slate-800 h-32 overflow-y-auto font-mono text-sm text-slate-400">
            <div className="text-xs uppercase font-bold text-slate-500 mb-2 sticky top-0 bg-slate-900">Game Log</div>
            <p> &gt; {gameState.lastPlayDescription}</p>
            <p> &gt; Visual Prompt: {visual?.prompt}</p>
          </div>

        </div>

        {/* Right: Betting Panel */}
        <BettingPanel
          gameState={gameState}
          wallet={wallet}
          bets={bets}
          onPlaceBet={handlePlaceBet}
        />
      </div>
    </div>
  );
};

export default App;