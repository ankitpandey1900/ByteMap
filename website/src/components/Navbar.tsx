import React, { useState } from 'react';
import { Download, Menu, X, Sparkles } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Banner Announcement */}
      <div className="bg-amber-400 border-b-2.5 border-slate-900 py-2 px-4 text-center text-xs sm:text-sm font-fredoka font-semibold text-slate-950 flex flex-wrap items-center justify-center gap-2 relative z-50">
        <span className="animate-comic-bounce">🚀</span>
        <span>ByteMap v1.0.4 is live for Windows & macOS! Native Rust speed, zero database memory policy, and Pop-Art visualization.</span>
        <a
          href="#download"
          className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold inline-flex items-center space-x-1 shadow-xs transition-all hover:-translate-y-0.5"
        >
          <span>Get Free</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </a>
      </div>

      {/* Main Comic Navbar */}
      <header className="sticky top-0 z-40 bg-sky-400 border-b-3 border-slate-900 shadow-comic relative select-none">
        <div className="absolute inset-0 bg-comic-dots opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between relative z-10">
          {/* Logo & Brand */}
          <a href="https://bytemap.alltracker.online/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-full bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-200 overflow-hidden p-0.5">
              <img
                src="/logo.png"
                alt="ByteMap Mascot"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bangers text-3xl tracking-wider text-white uppercase comic-text-shadow leading-none">
                BYTEMAP
              </span>
              <span className="text-[10px] font-comicNeue font-bold text-slate-900 tracking-widest uppercase leading-none mt-0.5">
                Storage Intelligence
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2">
            <a
              href="#features"
              className="px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-100 text-slate-800 font-comic text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all"
            >
              Features
            </a>
            <a
              href="#demo"
              className="px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-100 text-slate-800 font-comic text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all"
            >
              Live Demo
            </a>
            <a
              href="#comparison"
              className="px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-100 text-slate-800 font-comic text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all"
            >
              Why ByteMap
            </a>
            <a
              href="#author"
              className="px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-100 text-slate-800 font-comic text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all flex items-center space-x-1.5"
            >
              <img
                src="/ankit.jpg"
                alt="Ankit Pandey"
                className="w-4 h-4 rounded-full object-cover border border-slate-900"
              />
              <span>Author</span>
            </a>
            <a
              href="#faq"
              className="px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-100 text-slate-800 font-comic text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all"
            >
              FAQ
            </a>
            <a
              href="https://github.com/ankitpandey1900/ByteMap/blob/main/USER_MANUAL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 text-slate-900 font-comic text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all flex items-center space-x-1"
              title="Read the Interactive Survival Guide for Everyday Users"
            >
              <span>📖 User Guide</span>
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2.5">
            <a
              href="https://github.com/ankitpandey1900/ByteMap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-100 text-slate-900 font-comic text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Star</span>
            </a>
            <a
              href="#download"
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bangers text-sm uppercase tracking-wider shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0 transition-all group"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <span>Download Free</span>
            </a>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-comic-sm"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-5 bg-sky-300 border-t-2.5 border-slate-900 space-y-2">
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
              Interactive Demo
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
              About Ankit Pandey
            </a>
            <a
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl border-2.5 border-slate-900 bg-amber-400 font-bangers text-sm text-center uppercase tracking-wider shadow-comic"
            >
              Download for Windows (.exe)
            </a>
          </div>
        )}
      </header>
    </>
  );
};
