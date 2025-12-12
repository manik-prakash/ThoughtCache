import { Brain, BookMarked, Share2, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#0a0f14]">
      <nav className="bg-[#11181f] border-b border-[#1a232c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center border-b border-[#1a232c]">
          <div className="flex items-center gap-2">
            <Brain className="text-[#0acffe]" size={32} />
            <span className="text-xl font-bold text-text-primary">ThoughtCache</span>
          </div>
          <Button onClick={onGetStarted} size="sm">
            Get Started
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-text-primary mb-4">
            Your Digital Memory Palace
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
            Capture thoughts, save links, organize knowledge.
            Build your personal knowledge base with ease.
          </p>
          <Button onClick={onGetStarted} size="lg">
            Start Building Your Brain
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<Brain className="text-[#0acffe]" size={32} />}
            title="Capture Anything"
            description="Save thoughts, links, tweets, articles, and media in one place"
          />
          <FeatureCard
            icon={<BookMarked className="text-green-600" size={32} />}
            title="Organize Simply"
            description="Tag and folder your items for easy retrieval later"
          />
          <FeatureCard
            icon={<Search className="text-orange-600" size={32} />}
            title="Find Instantly"
            description="Full-text search across all your saved content and metadata"
          />
          <FeatureCard
            icon={<Share2 className="text-pink-600" size={32} />}
            title="Share Effortlessly"
            description="Create public links to share your knowledge with others"
          />
        </div>

        <div className="bg-[#11181f] rounded-2xl shadow-xl p-12 text-center border border-[#1a232c]">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to enhance your memory?
          </h2>
          <p className="text-lg text-text-muted mb-8">
            Join thousands who are building their second brain
          </p>
          <Button onClick={onGetStarted} size="lg">
            Get Started Free
          </Button>
        </div>
      </main>

      <footer className="border-t border-[#1a232c] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-text-muted">
          <p>ThoughtCache &copy; 2025. Built by Manik.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#11181f] rounded-lg p-6 shadow-sm border border-[#1a232c] hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted text-sm">{description}</p>
    </div>
  );
}
