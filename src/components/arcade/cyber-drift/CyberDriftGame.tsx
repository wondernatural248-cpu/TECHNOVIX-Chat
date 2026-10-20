import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gauge,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { initCyberDriftScene3D, CyberDriftScene3DInstance } from './3d/CyberDriftScene3D';
import { cyberDriftAudio } from './audio';
import { CAR_PROFILES } from './engine';
import { CarProfile, GameState, RaceStats } from './types';

interface CyberDriftGameProps {
  onReturnToArcade?: () => void;
}

export const CyberDriftGame: React.FC<CyberDriftGameProps> = ({ onReturnToArcade }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CyberDriftScene3DInstance | null>(null);

  // High score from local storage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('technovix_cyberdrift_best_score');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Selected car
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const selectedCar = CAR_PROFILES[selectedCarIndex];

  // Game state
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [isMuted, setIsMuted] = useState<boolean>(() => cyberDriftAudio.getIsMuted());
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);
  const [checkpointNotice, setCheckpointNotice] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [webGLFailed, setWebGLFailed] = useState<boolean>(false);

  // HUD stats for React display
  const [hudStats, setHudStats] = useState<RaceStats>({
    score: 0,
    highScore: 0,
    driftPointsBanked: 0,
    activeDriftScore: 0,
    currentCombo: 1.0,
    maxCombo: 1.0,
    speedKmh: 0,
    timeRemainingSec: 75,
    checkpointsCleared: 0,
    nitroPercent: 100,
    isDrifting: false,
    driftAngle: 0,
    totalDriftDistanceM: 0,
  });

  // Final race results for Game Over screen
  const [finalResults, setFinalResults] = useState<{
    score: number;
    isNewRecord: boolean;
    totalDriftM: number;
    maxCombo: number;
    checkpoints: number;
  }>({
    score: 0,
    isNewRecord: false,
    totalDriftM: 0,
    maxCombo: 1.0,
    checkpoints: 0,
  });

  // Mutable 3D Simulation state
  const simRef = useRef({
    playerLaneX: 0,          // -1 to 1 normalized lateral position on road
    playerDistance: 0,       // distance along 3D track (meters)
    speedKmh: 0,             // current speed in km/h
    maxSpeedKmh: 215,
    accel: 0.8,
    braking: 1.4,
    nitroBoostSpeed: 275,
    nitroLevel: 100,         // 0 to 100
    isNitroActive: false,
    steerAngle: 0,           // wheel steering angle (-0.45 to 0.45)
    driftAngle: 0,           // chassis slip angle
    isDrifting: false,
    activeDriftPoints: 0,
    currentCombo: 1.0,
    maxCombo: 1.0,
    bankedScore: 0,
    totalDriftDistance: 0,
    timeRemaining: 75.0,
    checkpointsPassed: 0,
    cameraShake: 0,
    lastTime: performance.now(),
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      drift: false,
      nitro: false,
    },
  });

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Update mute state
  const handleToggleMute = useCallback(() => {
    const nextMuted = cyberDriftAudio.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Initialize Three.js 3D Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const sceneInstance = initCyberDriftScene3D(container);
      sceneRef.current = sceneInstance;
      sceneInstance.switchCar(selectedCar.id);
    } catch (err) {
      console.error('Failed to initialize Three.js WebGL context:', err);
      setWebGLFailed(true);
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Switch car model when user changes selection
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.switchCar(selectedCar.id);
    }
  }, [selectedCarIndex, selectedCar.id]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      cyberDriftAudio.ensureRunning();

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'RACING') {
          setGameState('PAUSED');
          cyberDriftAudio.stopAll();
        } else if (gameState === 'PAUSED') {
          setGameState('RACING');
        }
        return;
      }

      const k = simRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = true;
      if (e.key === ' ' || e.key === 'Shift') k.drift = true;
      if (e.key === 'n' || e.key === 'N' || e.key === 'f' || e.key === 'F') k.nitro = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = simRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = false;
      if (e.key === ' ' || e.key === 'Shift') k.drift = false;
      if (e.key === 'n' || e.key === 'N' || e.key === 'f' || e.key === 'F') k.nitro = false;
    };

    const handleBlur = () => {
      if (gameState === 'RACING') {
        setGameState('PAUSED');
        cyberDriftAudio.stopAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  // Start new 3D race
  const startRace = useCallback((car: CarProfile) => {
    cyberDriftAudio.ensureRunning();
    cyberDriftAudio.playBeep(false);

    const s = simRef.current;
    s.playerLaneX = 0;
    s.playerDistance = 0;
    s.speedKmh = 0;
    s.maxSpeedKmh = car.topSpeedKmh;
    s.accel = 0.55 + car.accelRating * 0.08;
    s.braking = 1.4;
    s.nitroBoostSpeed = car.topSpeedKmh * 1.35;
    s.nitroLevel = 100;
    s.isNitroActive = false;
    s.steerAngle = 0;
    s.driftAngle = 0;
    s.isDrifting = false;
    s.activeDriftPoints = 0;
    s.currentCombo = 1.0;
    s.maxCombo = 1.0;
    s.bankedScore = 0;
    s.totalDriftDistance = 0;
    s.timeRemaining = 75.0;
    s.checkpointsPassed = 0;
    s.cameraShake = 0;
    s.lastTime = performance.now();

    // Reset checkpoints & energy cells in 3D track
    if (sceneRef.current) {
      sceneRef.current.track.checkpoints.forEach((cp) => (cp.cleared = false));
      sceneRef.current.track.energyCells.forEach((ec) => (ec.collected = false));
    }

    setGameState('COUNTDOWN');
    setCountdownNum(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        cyberDriftAudio.playBeep(false);
      } else if (count === 0) {
        setCountdownNum(0);
        cyberDriftAudio.playBeep(true);
      } else {
        clearInterval(interval);
        setGameState('RACING');
      }
    }, 750);
  }, []);

  // Main 3D WebGL Animation Loop
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - simRef.current.lastTime) / 1000, 0.1);
      simRef.current.lastTime = now;

      const sceneInstance = sceneRef.current;
      const container = containerRef.current;
      if (!sceneInstance || !container) return;

      // Handle Resize smoothly
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (sceneInstance.renderer.domElement.width !== w || sceneInstance.renderer.domElement.height !== h) {
        sceneInstance.resize(w, h);
      }

      const s = simRef.current;

      // ==========================================
      // 1. SHOWROOM MODE (Menu state)
      // ==========================================
      if (gameState === 'MENU') {
        sceneInstance.updateShowroom(now / 1000);
        return;
      }

      // ==========================================
      // 2. RACING PHYSICS & 3D SIMULATION
      // ==========================================
      if (gameState === 'RACING') {
        // Countdown timer
        s.timeRemaining -= dt;
        if (s.timeRemaining <= 0) {
          s.timeRemaining = 0;
          const finalScore = Math.floor(s.bankedScore + s.activeDriftPoints * s.currentCombo);
          let isNewRecord = false;
          if (finalScore > highScore) {
            isNewRecord = true;
            setHighScore(finalScore);
            try {
              localStorage.setItem('technovix_cyberdrift_best_score', String(finalScore));
            } catch {}
          }
          setFinalResults({
            score: finalScore,
            isNewRecord,
            totalDriftM: Math.floor(s.totalDriftDistance),
            maxCombo: s.maxCombo,
            checkpoints: s.checkpointsPassed,
          });
          setGameState('GAMEOVER');
          cyberDriftAudio.stopAll();
          return;
        }

        // Camera shake decay
        if (s.cameraShake > 0) {
          s.cameraShake = Math.max(0, s.cameraShake - dt * 25);
        }

        // Nitro Logic
        const isNitroKey = s.keys.nitro && s.nitroLevel > 3;
        if (isNitroKey && s.speedKmh > 50) {
          s.isNitroActive = true;
          s.nitroLevel = Math.max(0, s.nitroLevel - dt * 24);
          cyberDriftAudio.playNitroSurge();
        } else {
          s.isNitroActive = false;
        }

        // Target speed & acceleration
        const currentMaxSpeed = s.isNitroActive ? s.nitroBoostSpeed : s.maxSpeedKmh;
        const isUp = s.keys.up;
        const isDown = s.keys.down;

        if (isUp) {
          if (s.speedKmh < currentMaxSpeed) {
            s.speedKmh += s.accel * (s.isNitroActive ? 1.7 : 1.0) * 115 * dt;
          }
        } else if (isDown) {
          s.speedKmh = Math.max(0, s.speedKmh - s.braking * 190 * dt);
        } else {
          s.speedKmh = Math.max(0, s.speedKmh - 32 * dt); // Natural rolling resistance
        }

        // Steering dynamics
        let steerInput = 0;
        if (s.keys.left) steerInput -= 1;
        if (s.keys.right) steerInput += 1;

        const targetSteerAngle = steerInput * 0.42;
        s.steerAngle += (targetSteerAngle - s.steerAngle) * 12 * dt;

        // Road curvature centrifugal pull
        const trackTransform = sceneInstance.track.getTrackTransform(s.playerDistance);
        const roadCurvature = trackTransform.curvature;
        const speedPercent = s.speedKmh / s.maxSpeedKmh;

        // Apply centrifugal push
        s.playerLaneX -= roadCurvature * speedPercent * speedPercent * 1.5 * dt;

        // Apply player steering
        if (s.speedKmh > 8) {
          s.playerLaneX += steerInput * (1.1 + (selectedCar.driftRating / 10) * 0.4) * dt;
        }

        // ==========================================
        // 3D REAL DRIFT DYNAMICS & COMBO MULTIPLIER
        // ==========================================
        const handbrakeActive = s.keys.drift || (s.keys.down && s.speedKmh > 80);
        const hardTurnAtSpeed = Math.abs(steerInput) > 0 && s.speedKmh > 110 && Math.abs(roadCurvature) > 0.008;

        if ((handbrakeActive && s.speedKmh > 45 && Math.abs(steerInput) > 0) || hardTurnAtSpeed) {
          s.isDrifting = true;
          const targetDriftAngle = -steerInput * 0.38;
          s.driftAngle += (targetDriftAngle - s.driftAngle) * 7.5 * dt;

          // Accumulate drift points
          const driftRate = Math.abs(s.driftAngle) * (s.speedKmh / 100) * 195 * (selectedCar.driftRating / 8);
          s.activeDriftPoints += driftRate * dt;
          s.totalDriftDistance += (s.speedKmh * 0.28) * dt;

          // Nitro recharge while drifting cleanly
          s.nitroLevel = Math.min(100, s.nitroLevel + dt * 14);

          // Combo progression: 1.0 -> 1.5 -> 2.0 -> 3.0 -> 5.0 (MAX)
          const prevCombo = s.currentCombo;
          if (s.activeDriftPoints > 1600) s.currentCombo = 5.0;
          else if (s.activeDriftPoints > 900) s.currentCombo = 3.0;
          else if (s.activeDriftPoints > 450) s.currentCombo = 2.0;
          else if (s.activeDriftPoints > 150) s.currentCombo = 1.5;
          else s.currentCombo = 1.0;

          if (s.currentCombo > prevCombo) {
            cyberDriftAudio.playComboUp(s.currentCombo);
          }
          if (s.currentCombo > s.maxCombo) {
            s.maxCombo = s.currentCombo;
          }
        } else {
          // Straightening out: Bank drift points!
          if (s.isDrifting && s.activeDriftPoints > 20) {
            const bankedAmount = Math.floor(s.activeDriftPoints * s.currentCombo);
            s.bankedScore += bankedAmount;
            s.activeDriftPoints = 0;
            s.currentCombo = 1.0;
            cyberDriftAudio.playBeep(true);
          }
          s.isDrifting = false;
          s.driftAngle *= Math.exp(-6.5 * dt);
        }

        // ==========================================
        // 3D BARRIER COLLISION (|playerLaneX| > 1.02)
        // ==========================================
        if (Math.abs(s.playerLaneX) > 1.02) {
          s.speedKmh = Math.max(30, s.speedKmh - 120 * dt);
          s.cameraShake = 18;
          s.playerLaneX = Math.sign(s.playerLaneX) * 1.01;

          if (s.activeDriftPoints > 0) {
            s.activeDriftPoints = 0;
            s.currentCombo = 1.0;
            cyberDriftAudio.playCrashImpact();
          }
        }

        // Advance player along 3D track
        s.playerDistance += (s.speedKmh / 3.6) * dt;

        // Checkpoint checking
        const wrappedDist = s.playerDistance % sceneInstance.track.trackLength;
        sceneInstance.track.checkpoints.forEach((cp) => {
          if (!cp.cleared && Math.abs(wrappedDist - cp.distance) < 25) {
            cp.cleared = true;
            s.timeRemaining += 15.0;
            s.bankedScore += 5000;
            s.checkpointsPassed += 1;
            setCheckpointNotice(`SECTOR 0${cp.sector} CLEARED! +15 SECONDS`);
            cyberDriftAudio.playCheckpointChime();
            setTimeout(() => setCheckpointNotice(null), 2400);
          }
        });

        // Collectible Energy Cells checking
        sceneInstance.track.energyCells.forEach((ec) => {
          if (!ec.collected) {
            const distDiff = Math.abs(wrappedDist - ec.distance);
            const laneDiff = Math.abs(s.playerLaneX * sceneInstance.track.roadHalfWidth - ec.laneX);
            if (distDiff < 8 && laneDiff < 3.2) {
              ec.collected = true;
              s.nitroLevel = Math.min(100, s.nitroLevel + 35);
              s.bankedScore += 1000;
              cyberDriftAudio.playBeep(true);
            }
          }
        });

        // Audio updates
        cyberDriftAudio.updateEngine(s.speedKmh, isUp, s.isNitroActive);
        cyberDriftAudio.updateDrift(s.isDrifting, s.driftAngle);

        // Update React HUD state (throttled)
        if (Math.random() < 0.3) {
          setHudStats({
            score: Math.floor(s.bankedScore + s.activeDriftPoints * s.currentCombo),
            highScore,
            driftPointsBanked: s.bankedScore,
            activeDriftScore: Math.floor(s.activeDriftPoints),
            currentCombo: s.currentCombo,
            maxCombo: s.maxCombo,
            speedKmh: Math.floor(s.speedKmh),
            timeRemainingSec: Math.max(0, Math.ceil(s.timeRemaining)),
            checkpointsCleared: s.checkpointsPassed,
            nitroPercent: Math.floor(s.nitroLevel),
            isDrifting: s.isDrifting,
            driftAngle: s.driftAngle,
            totalDriftDistanceM: Math.floor(s.totalDriftDistance),
          });
        }
      }

      // Render 3D Racing frame
      sceneInstance.updateRacing(
        dt,
        s.playerDistance,
        s.playerLaneX,
        s.speedKmh,
        s.steerAngle,
        s.driftAngle,
        s.keys.down,
        s.keys.up,
        s.isNitroActive,
        s.cameraShake
      );
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, selectedCar, highScore]);

  // Car specification helper
  const renderCarStatBar = (val: number, color: string) => (
    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-white/5">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${(val / 10) * 100}%`, backgroundColor: color }}
      />
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-technovix-void overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full block cursor-crosshair" />

      {/* WebGL Fallback error banner if unsupported */}
      {webGLFailed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90">
          <div className="glass-panel p-6 rounded-2xl max-w-md text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">WebGL 3D Acceleration Required</h3>
            <p className="text-xs text-slate-400">
              Your browser or graphics hardware does not currently support WebGL acceleration. Please ensure hardware acceleration is enabled in your browser settings.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. HUD LAYER (RACING & COUNTDOWN)                         */}
      {/* ======================================================== */}
      {(gameState === 'RACING' || gameState === 'COUNTDOWN') && (
        <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between z-20">
          {/* Top Bar: Speedometer, Timer, Score, Checkpoint Notice */}
          <div className="flex items-start justify-between gap-2">
            {/* Left: Speedometer & Nitro */}
            <div className="glass-panel rounded-2xl p-3 border border-white/10 shadow-glass flex flex-col gap-1.5 min-w-[130px] sm:min-w-[170px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-neon-cyan" /> SPEED
                </span>
                <span className="text-[10px] font-mono text-neon-violet-light font-bold">
                  {hudStats.nitroPercent > 5 && simRef.current.isNitroActive ? 'NITRO' : 'GEAR 5'}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight text-glow-cyan">
                  {hudStats.speedKmh}
                </span>
                <span className="text-xs font-mono text-slate-400">KM/H</span>
              </div>

              {/* Nitro Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-neon-cyan flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-current" /> NITRO
                  </span>
                  <span className="text-slate-300 font-bold">{hudStats.nitroPercent}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-neon-cyan/30">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-neon-cyan transition-all duration-75"
                    style={{ width: `${hudStats.nitroPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Center: Checkpoint extension banner & Countdown */}
            <div className="flex flex-col items-center">
              {checkpointNotice && (
                <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-neon-violet via-purple-600 to-neon-cyan text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-glow-cyan animate-bounce">
                  ⚡ {checkpointNotice}
                </div>
              )}

              {gameState === 'COUNTDOWN' && (
                <div className="mt-12 text-center">
                  <div className="text-6xl sm:text-8xl font-black font-mono tracking-tighter bg-gradient-to-tr from-neon-cyan to-neon-violet bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_35px_rgba(0,240,255,0.8)]">
                    {countdownNum === 0 ? 'ENGAGE!' : countdownNum}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Timer, Best Score, Mute, Pause */}
            <div className="flex flex-col items-end gap-2">
              <div className="glass-panel rounded-2xl p-3 border border-white/10 shadow-glass flex flex-col items-end gap-1 min-w-[130px] sm:min-w-[160px]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  SECTOR TIME
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    hudStats.timeRemainingSec < 12 ? 'text-rose-400 animate-pulse' : 'text-white'
                  }`}
                >
                  {Math.floor(hudStats.timeRemainingSec / 60)}:
                  {(hudStats.timeRemainingSec % 60).toString().padStart(2, '0')}
                </div>

                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>BEST: {highScore.toLocaleString()}</span>
                </div>
              </div>

              {/* Controls buttons */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  onClick={handleToggleMute}
                  className="p-2 rounded-xl bg-technovix-surface/80 border border-white/10 text-slate-300 hover:text-neon-cyan hover:bg-white/10 transition-colors"
                  title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    setGameState('PAUSED');
                    cyberDriftAudio.stopAll();
                  }}
                  className="px-3 py-2 rounded-xl bg-technovix-surface/80 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white hover:border-neon-cyan/40 transition-colors"
                >
                  PAUSE
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Center: Drift Meter & Active Combo HUD */}
          <div className="flex flex-col items-center justify-center gap-2 mb-2">
            {hudStats.activeDriftScore > 0 && (
              <div className="flex flex-col items-center animate-pulse">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-technovix-void/80 border border-neon-violet/50 backdrop-blur-md shadow-glow-violet-sm">
                  <Flame className="w-4 h-4 text-neon-magenta animate-bounce" />
                  <span className="text-xs sm:text-sm font-black font-mono text-neon-cyan tracking-wider">
                    3D DRIFT: +{hudStats.activeDriftScore}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-neon-violet to-neon-magenta text-white text-[11px] font-black font-mono">
                    {hudStats.currentCombo.toFixed(1)}x
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1">
                  Counter-steer to balance slide • Straighten out to bank points!
                </span>
              </div>
            )}

            {/* Total Banked Score Display */}
            <div className="glass-panel px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2 shadow-sm">
              <span className="text-slate-500 uppercase tracking-widest text-[10px]">SCORE</span>
              <span className="text-sm font-bold text-white tracking-wide">
                {hudStats.score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MOBILE TOUCH CONTROLS (Only on touch devices)        */}
      {/* ======================================================== */}
      {gameState === 'RACING' && isTouchDevice && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-end justify-between p-4">
          {/* Left steering pad */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                simRef.current.keys.left = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                simRef.current.keys.left = false;
              }}
              className="w-16 h-16 rounded-2xl bg-technovix-surface/85 border border-neon-cyan/40 active:bg-neon-cyan/30 text-white flex items-center justify-center font-bold text-xl active:scale-95 shadow-glass"
            >
              ◄
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                simRef.current.keys.right = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                simRef.current.keys.right = false;
              }}
              className="w-16 h-16 rounded-2xl bg-technovix-surface/85 border border-neon-cyan/40 active:bg-neon-cyan/30 text-white flex items-center justify-center font-bold text-xl active:scale-95 shadow-glass"
            >
              ►
            </button>
          </div>

          {/* Right action pad: Nitro, Drift/Brake, Accelerate */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                simRef.current.keys.nitro = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                simRef.current.keys.nitro = false;
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-neon-cyan text-technovix-void flex flex-col items-center justify-center font-black text-[10px] active:scale-90 shadow-glow-cyan-sm"
            >
              <Zap className="w-4 h-4 fill-current" />
              NITRO
            </button>

            <button
              onTouchStart={(e) => {
                e.preventDefault();
                simRef.current.keys.drift = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                simRef.current.keys.drift = false;
              }}
              className="w-16 h-16 rounded-2xl bg-purple-600/80 border border-neon-violet active:bg-neon-violet text-white flex flex-col items-center justify-center font-bold text-xs active:scale-95 shadow-glass"
            >
              <Flame className="w-4 h-4" />
              DRIFT
            </button>

            <button
              onTouchStart={(e) => {
                e.preventDefault();
                simRef.current.keys.up = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                simRef.current.keys.up = false;
              }}
              className="w-16 h-16 rounded-2xl bg-neon-cyan text-technovix-void flex flex-col items-center justify-center font-black text-sm active:scale-95 shadow-glow-cyan-sm"
            >
              GAS
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MENU SCREEN (3D Showroom & Car Selector)              */}
      {/* ======================================================== */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            {/* Top header & return button */}
            <div className="flex items-center justify-between">
              {onReturnToArcade && (
                <button
                  onClick={onReturnToArcade}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Chat
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleToggleMute}
                  className="p-2 rounded-xl bg-technovix-surface border border-white/10 text-slate-300 hover:text-neon-cyan transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowControlsModal(true)}
                  className="p-2 rounded-xl bg-technovix-surface border border-white/10 text-slate-300 hover:text-neon-cyan transition-colors"
                  title="Controls Guide"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title Branding */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-violet/20 border border-neon-violet/40 text-neon-violet-light text-[10px] font-mono tracking-widest uppercase mb-1">
                <Sparkles className="w-3 h-3 text-neon-cyan" />
                TECHNOVIX ARCADE • REAL-TIME 3D THREE.JS EDITION
              </div>
              <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]">
                CYBER DRIFT 3D
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-normal">
                High-speed 3D slipstream drifting through the illuminated midnight sectors.
              </p>
            </div>

            {/* Best Score Pill */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-technovix-surface/80 border border-amber-400/30 text-amber-300 text-xs font-mono shadow-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>PERSONAL BEST: {highScore.toLocaleString()} PTS</span>
              </div>
            </div>

            {/* Car Selection Carousel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                <span>SELECT 3D CHASSIS (ORBITING IN SHOWROOM)</span>
                <span className="font-mono text-neon-cyan">{selectedCarIndex + 1} / {CAR_PROFILES.length}</span>
              </div>

              <div className="relative p-4 rounded-2xl bg-technovix-void/75 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setSelectedCarIndex((prev) => (prev > 0 ? prev - 1 : CAR_PROFILES.length - 1))
                    }
                    className="p-2 rounded-xl bg-technovix-surface hover:bg-white/10 text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="text-center">
                    <h3
                      className="text-lg font-black tracking-tight"
                      style={{ color: selectedCar.primaryColor }}
                    >
                      {selectedCar.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedCar.tagline}</p>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedCarIndex((prev) => (prev < CAR_PROFILES.length - 1 ? prev + 1 : 0))
                    }
                    className="p-2 rounded-xl bg-technovix-surface hover:bg-white/10 text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Car Spec Bars */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>TOP SPEED</span>
                      <span className="text-white font-mono">{selectedCar.topSpeedKmh} KM/H</span>
                    </div>
                    {renderCarStatBar(selectedCar.topSpeedKmh / 25, selectedCar.primaryColor)}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>ACCELERATION</span>
                      <span className="text-white font-mono">{selectedCar.accelRating}/10</span>
                    </div>
                    {renderCarStatBar(selectedCar.accelRating, selectedCar.primaryColor)}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>DRIFT MULTIPLIER</span>
                      <span className="text-white font-mono">{selectedCar.driftRating}/10</span>
                    </div>
                    {renderCarStatBar(selectedCar.driftRating, selectedCar.accentColor)}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>NITRO RECHARGE</span>
                      <span className="text-white font-mono">{selectedCar.nitroRating}/10</span>
                    </div>
                    {renderCarStatBar(selectedCar.nitroRating, '#00f0ff')}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic pt-1 text-center">
                  "{selectedCar.description}"
                </p>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                onClick={() => startRace(selectedCar)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-violet via-purple-600 to-neon-cyan text-white font-black text-base uppercase tracking-wider shadow-glow-cyan hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                LAUNCH 3D ENGINE
              </button>
            </div>

            <div className="text-center text-[11px] text-slate-500 font-mono">
              Desktop: WASD / Arrows to Drive • Space/Shift to Drift • N for Nitro • P to Pause
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PAUSE SCREEN                                          */}
      {/* ======================================================== */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-white/15 shadow-2xl text-center space-y-5">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-neon-cyan" />
              RACE PAUSED
            </h2>
            <p className="text-xs text-slate-400">
              Terminal engine idle. Press Resume or ESC to jump right back in.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  setGameState('RACING');
                  simRef.current.lastTime = performance.now();
                }}
                className="w-full py-3 rounded-xl bg-neon-cyan text-technovix-void font-black text-sm uppercase tracking-wide hover:brightness-110 active:scale-98 transition-all shadow-glow-cyan-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> RESUME RACE
              </button>

              <button
                onClick={() => startRace(selectedCar)}
                className="w-full py-2.5 rounded-xl bg-technovix-surface border border-white/10 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RESTART
              </button>

              {onReturnToArcade && (
                <button
                  onClick={onReturnToArcade}
                  className="w-full py-2.5 rounded-xl bg-transparent border border-white/5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Exit to Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. GAME OVER / RACE FINISHED RESULTS SCREEN              */}
      {/* ======================================================== */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl text-center space-y-5">
            {finalResults.isNewRecord && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 text-xs font-bold font-mono animate-bounce">
                🏆 NEW PERSONAL RECORD!
              </div>
            )}

            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">RACE COMPLETED</h2>
              <p className="text-xs text-slate-400 mt-0.5">Session results logged to local terminal.</p>
            </div>

            {/* Score Callout */}
            <div className="p-4 rounded-2xl bg-technovix-void/70 border border-neon-cyan/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                FINAL DRIFT SCORE
              </span>
              <div className="text-4xl font-black font-mono text-neon-cyan text-glow-cyan">
                {finalResults.score.toLocaleString()}
              </div>
            </div>

            {/* Race Stats Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-technovix-surface/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">DRIFT DISTANCE</span>
                <span className="font-bold text-white font-mono text-sm">
                  {finalResults.totalDriftM}m
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-technovix-surface/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">PEAK COMBO</span>
                <span className="font-bold text-neon-violet-light font-mono text-sm">
                  {finalResults.maxCombo.toFixed(1)}x
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-technovix-surface/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">CHECKPOINTS</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {finalResults.checkpoints}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => startRace(selectedCar)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-violet to-neon-cyan text-white font-black text-sm uppercase tracking-wide shadow-glow-cyan hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RACE AGAIN
              </button>

              <button
                onClick={() => setGameState('MENU')}
                className="w-full py-2.5 rounded-xl bg-technovix-surface border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Switch Vehicle / Main Menu
              </button>

              {onReturnToArcade && (
                <button
                  onClick={onReturnToArcade}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Return to Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CONTROLS GUIDE MODAL                                  */}
      {/* ======================================================== */}
      {showControlsModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-neon-cyan" />
                HOW TO PLAY
              </h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-technovix-surface/60">
                <span className="font-semibold text-white">Steering</span>
                <span className="font-mono text-neon-cyan">A / D or ← / →</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-technovix-surface/60">
                <span className="font-semibold text-white">Accelerate / Brake</span>
                <span className="font-mono text-neon-cyan">W / S or ↑ / ↓</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-technovix-surface/60">
                <span className="font-semibold text-white">Initiate 3D Power Drift</span>
                <span className="font-mono text-neon-magenta">SPACE or SHIFT</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-technovix-surface/60">
                <span className="font-semibold text-white">Nitro Boost</span>
                <span className="font-mono text-neon-cyan">N or F Key</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-technovix-surface/60">
                <span className="font-semibold text-white">Pause / Resume</span>
                <span className="font-mono text-slate-300">P or ESC</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-neon-violet/10 border border-neon-violet/30 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-neon-violet-light">PRO 3D DRIFT TIP:</div>
              <div>
                Hold turn into a corner and tap <span className="text-neon-cyan font-bold">SPACE</span> to break traction. Counter-steer to balance the slide angle and charge your multiplier up to <span className="text-neon-magenta font-bold">5.0x</span>!
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 rounded-xl bg-neon-cyan text-technovix-void font-bold text-xs hover:brightness-110 transition-colors"
            >
              GOT IT, LET'S RACE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
