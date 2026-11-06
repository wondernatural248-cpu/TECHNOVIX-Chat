import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  Check,
  CheckCircle2,
  Lock,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthLayout } from './AuthLayout';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const SignUpScreen: React.FC = () => {
  const { setActiveScreen, signUpWithEmail, isSupabaseConfigured } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase backend is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('Please accept the protocol agreement to proceed.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Security Passkey must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const res = await signUpWithEmail(email, password, displayName, username, selectedAvatar);
    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
      return;
    }

    if (res.needsEmailConfirmation) {
      setSuccessInfo(
        'Account created! Verification link sent to your email. (Note: You can turn off "Confirm email" in Supabase Auth Settings to sign in without email confirmation).'
      );
    }
  };

  return (
    <AuthLayout subtitle="Register an encrypted identity on the TECHNOVIX mesh">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Alerts */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-400">Registration Error:</span>{' '}
              {errorMessage}
            </div>
          </div>
        )}

        {successInfo && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-3 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-400">Identity Created:</span>{' '}
              {successInfo}
            </div>
          </div>
        )}

        {/* Avatar Preset Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Cyber Avatar
          </label>
          <div className="flex items-center justify-center gap-3 py-1">
            {AVATAR_PRESETS.map((avatarUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAvatar(avatarUrl)}
                className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-200 ${
                  selectedAvatar === avatarUrl
                    ? 'ring-2 ring-neon-cyan shadow-glow-cyan-sm scale-105'
                    : 'opacity-60 hover:opacity-100 ring-1 ring-white/10'
                }`}
              >
                <img src={avatarUrl} alt="Avatar option" className="w-full h-full object-cover" />
                {selectedAvatar === avatarUrl && (
                  <span className="absolute inset-0 bg-neon-cyan/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Full Name / Moniker"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Orion Cross"
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="Network Handle"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. orion.cross"
          leftIcon={<AtSign className="w-4 h-4" />}
          helperText="Unique username used for peer search"
        />

        <Input
          label="Neural / Work Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="orion@technovix.io"
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Secret Passkey"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
          <input
            id="terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="rounded bg-technovix-panel border-white/20 text-neon-violet focus:ring-neon-violet/50 accent-neon-violet h-4 w-4"
          />
          <label htmlFor="terms" className="cursor-pointer select-none">
            I agree to the <span className="text-neon-cyan">TECHNOVIX Neural Mesh Charter</span> & Privacy Protocols
          </label>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<Sparkles className="w-4 h-4 text-neon-cyan" />}
          >
            Create Identity & Launch
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setActiveScreen('welcome')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Sign In
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
