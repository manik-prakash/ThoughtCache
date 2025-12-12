import { useState } from 'react';
import { Brain } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export function Signup({ onSwitchToLogin }: SignupProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!displayName) {
      newErrors.displayName = 'Name is required';
    }
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
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    console.log(error);

    if (error) {
      if (error.message.includes('already registered')) {
        showToast('error', 'This email is already registered');
        onSwitchToLogin();
      } else {
        showToast('error', error.message);
      }
    } else {
      showToast('success', 'Account created successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11181f] rounded-lg shadow-xl p-8 border border-[#1a232c]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Brain className="text-[#0acffe]" size={32} />
          <span className="text-2xl font-bold text-text-primary">ThoughtCache</span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">Create Account</h1>
        <p className="text-text-muted mb-8 text-center">Start building your knowledge base today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={errors.displayName}
            placeholder="John Doe"
            autoComplete="name"
            disabled={loading}
          />
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
            autoComplete="new-password"
            disabled={loading}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={loading}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-muted">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[#0acffe] hover:text-[#28ffd3] font-medium focus:outline-none focus:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
