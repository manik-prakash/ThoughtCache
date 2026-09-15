import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function GuestBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0acffe]/10 border-b border-[#0acffe]/30 text-sm text-text-primary text-center">
      <Sparkles size={16} className="text-[#0acffe] shrink-0" />
      <span>
        You're in demo mode — this account and everything in it will be deleted in 24h.{' '}
        <Link to="/signup" className="text-[#0acffe] font-medium hover:underline">
          Sign up to keep it
        </Link>
      </span>
    </div>
  );
}
