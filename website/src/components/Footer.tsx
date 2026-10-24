import React from 'react';
import { ExternalLink } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t-3 border-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative select-none">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <a href="https://bytemap.alltracker.online/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm overflow-hidden p-0.5 group-hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              alt="ByteMap Mascot"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <span className="font-bangers text-2xl text-slate-900 uppercase tracking-wider block leading-none">
              BYTEMAP
            </span>
            <span className="text-[11px] font-comicNeue font-bold text-slate-500 block mt-0.5">
              Desktop Storage Intelligence for Windows & macOS • v1.0.9
            </span>
          </div>
        </a>

        {/* Creator Attribution Button */}
        <div className="flex items-center space-x-3">
          <a
            href="https://ankitpandey19.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 text-slate-900 font-comic uppercase text-xs shadow-comic-sm hover:-translate-y-0.5 transition-all group"
            title="Visit Ankit Pandey's Portfolio"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-900 shrink-0 shadow-xs">
              <img
                src="/ankit.jpg"
                alt="Ankit Pandey"
                className="w-full h-full object-cover"
              />
            </div>
            <span>Made by Ankit Pandey</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-900 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href="https://github.com/ankitpandey1900/ByteMap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 font-comic uppercase text-xs shadow-comic-sm hover:-translate-y-0.5 transition-all"
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t-2 border-slate-900/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-2">
        <p>Copyright © 2026 Ankit Pandey. Released under the MIT License.</p>
        <p className="flex items-center space-x-1">
          <span>Engineered with Rust, Tauri 2 & React</span>
        </p>
      </div>
    </footer>
  );
};
