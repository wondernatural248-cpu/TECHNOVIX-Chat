import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Database, Lock, Mail, Play, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthLayout } from './AuthLayout';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const SignInScreen: React.FC = () => {
  const { setActiveScreen, signInWithEmail, isSupabaseConfigured } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (isSupabaseConfigured) {
      setIsLoading(true);
      const res = await signInWithEmail(email, password);
      setIsLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
      }
    } else {
      // Demo preview launch
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setActiveScreen('app');
      }, 500);
    }
  };

  const handleInstantDemo = () => {
    setActiveScreen('app');
  };

  return (
    <AuthLayout subtitle="Quantum encrypted communications for visionary teams">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Backend Connectivity Status Indicator */}
        {isSupabaseConfigured ? (
          <div className="bg-technovix-void/80 border border-emerald-500/30 rounded-2xl p-3 text-xs text-slate-300 flex items-start gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-400">Live Supabase Connected:</span>{' '}
              Sign in with your registered credentials. Real-time PostgreSQL messaging is active.
            </div>
          </div>
        ) : (
          <div className="bg-technovix-void/80 border border-neon-cyan/20 rounded-2xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neon-cyan">Supabase Setup Notice:</span>{' '}
              Add your credentials to <span className="font-mono text-neon-violet-light">.env.local</span> to activate multi-user live messaging. Or explore right now via Instant Demo Preview!
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3 text-xs text-rose-300 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-400">Authentication Error:</span> {errorMessage}
            </div>
          </div>
        )}

        <Input
          label="Registered Identity / Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operative@technovix.io"
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="space-y-1">
          <Input
            label="Security Passkey"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter passkey"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
        </div>

        <div className="pt-2 space-y-3">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSupabaseConfigured ? 'Authenticate & Sign In' : 'Sign In / Preview'}
          </Button>

          <Button
            type="button"
            variant="cyber"
            className="w-full"
            onClick={handleInstantDemo}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
          >
            Instant Demo Preview
          </Button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-technovix-panel px-3 text-slate-500 font-mono text-[10px]">
              Need an encrypted identity?
            </span>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setActiveScreen('signup')}
            className="text-xs text-slate-300 hover:text-neon-cyan font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
            Create a new identity profile <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
