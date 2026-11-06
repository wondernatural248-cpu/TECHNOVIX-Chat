import React, { useState } from 'react';
import {
  Bell,
  Check,
  Database,
  Edit2,
  Key,
  LogOut,
  Moon,
  ShieldCheck,
  Smartphone,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusType } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const ProfileDrawer: React.FC = () => {
  const {
    isProfileOpen,
    setIsProfileOpen,
    currentUser,
    setCurrentUser,
    signOut,
    isSupabaseConfigured,
    isSupabaseActive,
  } = useApp();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isProfileOpen) return null;

  const handleStatusChange = (newStatus: StatusType) => {
    setCurrentUser((prev) => ({ ...prev, status: newStatus }));
  };

  const handleSaveBio = () => {
    setCurrentUser((prev) => ({ ...prev, bio: bioInput }));
    setIsEditingBio(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      {/* Background click to dismiss */}
      <div className="flex-1" onClick={() => setIsProfileOpen(false)} />

      {/* Slide-out drawer */}
      <div className="w-full max-w-md h-full bg-technovix-panel/95 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto backdrop-blur-2xl p-6 relative">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-neon-cyan" />
              Terminal Identity
            </h2>
            <button
              onClick={() => setIsProfileOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Identity Card */}
          <div className="py-6 flex flex-col items-center text-center">
            <div className="relative mb-3">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.displayName}
                size="xl"
                status={currentUser.status}
                showStatus
                className="ring-4 ring-neon-violet/30"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold text-white">{currentUser.displayName}</h3>
              {currentUser.isVerified && (
                <span title="Verified" className="text-neon-cyan text-sm">
                  ✓
                </span>
              )}
            </div>

            <p className="text-xs text-neon-cyan font-mono mt-0.5">@{currentUser.username}</p>

            {/* Status Selector */}
            <div className="mt-4 flex items-center gap-1.5 bg-technovix-void/70 p-1 rounded-xl border border-white/10">
              {(['online', 'away', 'busy', 'offline'] as StatusType[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    currentUser.status === st
                      ? 'bg-technovix-surface text-neon-cyan shadow-sm border border-neon-cyan/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Bio */}
            <div className="mt-5 w-full bg-technovix-void/50 rounded-xl p-3 border border-white/5 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Status & Bio
                </span>
                {!isEditingBio ? (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-xs text-neon-violet-light hover:text-white flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSaveBio}
                    className="text-xs text-neon-cyan hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                )}
              </div>

              {isEditingBio ? (
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full text-xs bg-technovix-panel border border-neon-cyan/40 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-neon-cyan"
                  rows={2}
                />
              ) : (
                <p className="text-xs text-slate-300 italic">{currentUser.bio}</p>
              )}
            </div>
          </div>

          {/* Preferences & Architecture Status */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              System Settings
            </h4>

            {/* Dark Cyber Theme */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-technovix-surface/40 border border-white/5">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-neon-violet-light" />
                <span className="text-xs text-slate-200 font-medium">Theme Aesthetic</span>
              </div>
              <Badge variant="violet" size="xs">
                Neon Cyberpunk
              </Badge>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-technovix-surface/40 border border-white/5">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-neon-cyan" />
                <span className="text-xs text-slate-200 font-medium">Neural Alerts</span>
              </div>
              <button
                onClick={() => setNotificationsEnabled((prev) => !prev)}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  notificationsEnabled ? 'bg-neon-cyan' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-technovix-void transition-transform ${
                    notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-technovix-surface/40 border border-white/5">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-200 font-medium">Audio Feedback</span>
              </div>
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? 'bg-neon-violet' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Encryption Key Fingerprint */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-technovix-surface/40 border border-white/5">
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-200 font-medium">Key Fingerprint</span>
              </div>
              <span className="text-[10px] font-mono text-neon-cyan bg-technovix-void/80 px-2 py-0.5 rounded border border-white/5">
                0x7F2A...9C1D
              </span>
            </div>

            {/* Active Device */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-technovix-surface/40 border border-white/5">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-200 font-medium">Active Node</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Web Client • Chrome
              </span>
            </div>

            {/* Supabase Integration Readiness */}
            <div className={`p-3 rounded-xl bg-technovix-void/70 border space-y-2 ${
              isSupabaseActive
                ? 'border-emerald-500/30'
                : 'border-neon-cyan/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Database className={`w-4 h-4 ${isSupabaseActive ? 'text-emerald-400' : 'text-neon-cyan'}`} />
                  Supabase Backend
                </div>
                {isSupabaseActive ? (
                  <Badge variant="cyan" size="xs">Live Connected</Badge>
                ) : isSupabaseConfigured ? (
                  <Badge variant="violet" size="xs">Awaiting Auth</Badge>
                ) : (
                  <Badge variant="amber" size="xs">Disconnected</Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isSupabaseActive
                  ? 'Real-time PostgreSQL messaging, user authentication, and RLS are actively enforcing cryptographic session boundaries.'
                  : 'To enable real multi-user messaging, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <Button
            variant="danger"
            className="w-full text-xs"
            onClick={async () => {
              setIsProfileOpen(false);
              await signOut();
            }}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>

          <p className="text-[10px] text-center text-slate-500 font-mono">
            TECHNOVIX Chat • Quantum Mesh v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};
