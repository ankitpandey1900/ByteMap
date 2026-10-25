import React from 'react';
import { Globe, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export const AuthorSpotlight: React.FC = () => {
  return (
    <section id="author" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative">
      <div className="bg-amber-100 rounded-3xl border-3 border-slate-900 shadow-comic-xl p-6 sm:p-10 relative overflow-hidden">
        {/* Halftone texture */}
        <div className="absolute inset-0 bg-comic-dots opacity-20 pointer-events-none" />

        <div className="relative z-10">
          {/* Top Pill */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900">
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Meet The Creator</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-600">
              ByteMap Open Source Project
            </span>
          </div>

          {/* Author Card Container */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 bg-white p-6 sm:p-8 rounded-2xl border-2.5 border-slate-900 shadow-comic">
            {/* Avatar Photo Frame */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-amber-400 border-3 border-slate-900 overflow-hidden shrink-0 shadow-comic-lg relative group">
              <img
                src="/ankit.webp"
                alt="Ankit Pandey"
                width={144}
                height={144}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Author Details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2.5 flex-wrap gap-2">
                <h3 className="font-bangers text-3xl sm:text-4xl text-slate-900 uppercase tracking-wide">
                  Ankit Pandey
                </h3>
                <span className="px-3 py-1 rounded-lg bg-emerald-400 border-2 border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-comic-sm">
                  Creator & Lead Architect
                </span>
              </div>

              {/* Bio Quote */}
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border-2 border-slate-900 shadow-xs inline-block">
                <p className="font-comicNeue text-base sm:text-lg font-bold text-slate-900 italic">
                  "I build products. Life? Still in debugging mode."
                </p>
              </div>

              {/* Story */}
              <p className="mt-3.5 font-comicNeue text-sm font-bold text-slate-600 leading-relaxed">
                Software engineer passionate about building super-fast, privacy-first desktop products.
                ByteMap was engineered to replace clunky, slow disk utilities with a lightweight native Rust engine
                wrapped in a vibrant, tactile Pop-Art visualizer.
              </p>

              {/* Contact Links & Portfolio Action Buttons */}
              <div className="mt-6 flex items-center justify-center sm:justify-start space-x-2.5 flex-wrap gap-3">
                <a
                  href="https://ankitpandey19.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 border-2.5 border-slate-900 font-comic font-bold text-xs uppercase shadow-comic hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
                >
                  <Globe className="w-4 h-4 text-slate-900 group-hover:rotate-12 transition-transform" />
                  <span>Visit Portfolio (ankitpandey19.vercel.app)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                </a>

                <a
                  href="https://github.com/ankitpandey1900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 font-comic font-bold text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub @ankitpandey1900</span>
                </a>

                <a
                  href="mailto:ankit1pandey11@gmail.com"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 font-comic font-bold text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
