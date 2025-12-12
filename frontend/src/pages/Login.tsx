import { useState } from 'react';
import { Brain } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

interface LoginProps {
  onSwitchToSignup: () => void;
}

export function Login({ onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        showToast('error', 'Invalid email or password');
      } else {
        showToast('error', error.message);
      }
    } else {
      showToast('success', 'Welcome back!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11181f] rounded-lg shadow-xl p-8 border border-[#1a232c]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Brain className="text-[#0acffe]" size={32} />
          <span className="text-2xl font-bold text-text-primary">ThoughtCache</span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">Welcome Back</h1>
        <p className="text-text-muted mb-8 text-center">Sign in to access your knowledge base</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-[#0acffe] hover:text-[#28ffd3] focus:outline-none focus:underline"
            >
              Forgot password?
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-muted">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-[#0acffe] hover:text-[#28ffd3] font-medium focus:outline-none focus:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
