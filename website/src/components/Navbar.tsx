import React, { useState } from 'react';
import { Download, Menu, X, Sparkles, BookOpen, Flame } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Banner Announcement */}
      <div className="bg-amber-400 border-b-2.5 border-slate-900 py-2 px-4 text-center text-xs sm:text-sm font-fredoka font-semibold text-slate-950 flex flex-wrap items-center justify-center gap-2 relative z-50">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
          v1.0.14
        </span>
        <span>
          Light-first pop-art UI, Carbon Slate Dark Mode, Balanced Treemap, full-screen User Docs &amp; parallel BLAKE3 duplicates!
        </span>
        <a
          href="#download"
          className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-amber-50 border border-slate-900 text-slate-900 font-bold inline-flex items-center space-x-1 shadow-xs transition-all hover:-translate-y-0.5 whitespace-nowrap"
        >
          <span>Get Free</span>
          <Sparkles className="w-3 h-3 text-amber-600" />
        </a>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-sky-400 border-b-3 border-slate-900 shadow-comic relative select-none">
        <div className="absolute inset-0 bg-comic-dots opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4 relative z-10">
          {/* Logo & Brand */}
          <a
            href="https://bytemap.alltracker.online/"
            className="flex items-center space-x-3 shrink-0 group"
          >
            <div className="w-11 h-11 rounded-full bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm group-hover:scale-105 group-hover:rotate-3 transition-all duration-200 overflow-hidden p-0.5 shrink-0">
              <img
                src="/logo.webp"
                alt="ByteMap Mascot"
                width={44}
                height={44}
                decoding="async"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bangers text-2xl xl:text-[26px] tracking-tight text-white uppercase comic-text-shadow leading-none">
                BYTEMAP
              </span>
              <span className="text-[10px] font-comicNeue font-bold text-slate-950 tracking-wider uppercase leading-none mt-1">
                Storage Intelligence
              </span>
            </div>
          </a>

          {/* Desktop Unified Navigation Dock */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center bg-white/95 border-2.5 border-slate-900 rounded-2xl p-1 shadow-comic-sm gap-0.5 whitespace-nowrap"
          >
            <a
              href="#proof"
              className="px-2.5 xl:px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-slate-900 font-comic text-xs font-bold uppercase tracking-tight transition-colors inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>1.3M Proof</span>
            </a>
            <a
              href="#features"
              className="px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-sky-100 text-slate-800 hover:text-slate-950 font-comic text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap"
            >
              Features
            </a>
            <a
              href="#demo"
              className="px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-sky-100 text-slate-800 hover:text-slate-950 font-comic text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap"
            >
              Live Demo
            </a>
            <a
              href="#comparison"
              className="px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-sky-100 text-slate-800 hover:text-slate-950 font-comic text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap"
            >
              Why ByteMap
            </a>
            <a
              href="#author"
              className="px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-sky-100 text-slate-800 hover:text-slate-950 font-comic text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap"
            >
              Author
            </a>
            <a
              href="#faq"
              className="px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-sky-100 text-slate-800 hover:text-slate-950 font-comic text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap"
            >
              FAQ
            </a>
            <a
              href="https://github.com/ankitpandey1900/ByteMap/blob/main/USER_MANUAL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-100 text-slate-900 font-comic text-xs font-bold uppercase tracking-tight transition-colors inline-flex items-center gap-1 whitespace-nowrap"
              title="Read the User Guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Guide</span>
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <a
              href="https://github.com/ankitpandey1900/ByteMap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-50 text-slate-900 font-comic text-xs font-bold uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              <GithubIcon className="w-4 h-4 shrink-0" />
              <span>Star</span>
            </a>
            <a
              href="#download"
              className="inline-flex items-center gap-2 h-10 px-4 xl:px-5 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bangers text-xs xl:text-sm uppercase tracking-wider shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0 transition-all group whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0 group-hover:translate-y-0.5 transition-transform" />
              <span>Download Free</span>
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-comic-sm"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu Hamburger (< sm) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-comic-sm"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile / Tablet Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-5 bg-sky-300 border-t-2.5 border-slate-900 space-y-2">
            <a
              href="#proof"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-900 bg-amber-300 font-comic text-xs uppercase shadow-comic-sm font-bold text-slate-900"
            >
              <Flame className="w-4 h-4 text-orange-600" />
              <span>1.3M File Scan Proof</span>
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 rounded-xl border-2 border-slate-900 bg-white font-comic text-xs uppercase shadow-comic-sm"
            >
              Features
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 rounded-xl border-2 border-slate-900 bg-white font-comic text-xs uppercase shadow-comic-sm"
            >
              Live Demo
            </a>
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 rounded-xl border-2 border-slate-900 bg-white font-comic text-xs uppercase shadow-comic-sm"
            >
              Why ByteMap
            </a>
            <a
              href="#author"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 rounded-xl border-2 border-slate-900 bg-white font-comic text-xs uppercase shadow-comic-sm"
            >
              Author
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 rounded-xl border-2 border-slate-900 bg-white font-comic text-xs uppercase shadow-comic-sm"
            >
              FAQ
            </a>
            <a
              href="https://github.com/ankitpandey1900/ByteMap/blob/main/USER_MANUAL.md"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-900 bg-white font-comic text-xs uppercase shadow-comic-sm"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>User Guide</span>
            </a>
            <a
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl border-2.5 border-slate-900 bg-amber-400 font-bangers text-sm text-center uppercase tracking-wider shadow-comic"
            >
              Download Free
            </a>
          </div>
        )}
      </header>
    </>
  );
};
