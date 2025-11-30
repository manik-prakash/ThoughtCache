import { Brain, BookMarked, Share2, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-gray-100">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">Second Brain</span>
          </div>
          <Button onClick={onGetStarted} size="sm">
            Get Started
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Your Digital Memory Palace
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Capture thoughts, save links, organize knowledge.
            Build your personal knowledge base with ease.
          </p>
          <Button onClick={onGetStarted} size="lg">
            Start Building Your Brain
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<Brain className="text-blue-600" size={32} />}
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

        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to enhance your memory?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands who are building their second brain
          </p>
          <Button onClick={onGetStarted} size="lg">
            Get Started Free
          </Button>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Second Brain &copy; 2025. Built for knowledge seekers.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
