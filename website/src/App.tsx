import React from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RealWorldProof } from './components/RealWorldProof';
import { InteractiveDemo } from './components/InteractiveDemo';
import { FeaturesGrid } from './components/FeaturesGrid';
import { ComparisonTable } from './components/ComparisonTable';
import { AuthorSpotlight } from './components/AuthorSpotlight';
import { DownloadSection } from './components/DownloadSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fffbeb] text-slate-900 selection:bg-amber-400 selection:text-slate-900 relative">
      {/* Halftone texture overlay */}
      <div className="fixed inset-0 bg-comic-dots opacity-[0.15] pointer-events-none z-0" />

      {/* Main Page Layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <HeroSection />
          <RealWorldProof />
          <InteractiveDemo />
          <FeaturesGrid />
          <ComparisonTable />
          <DownloadSection />
          <AuthorSpotlight />
          <FaqSection />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default App;
