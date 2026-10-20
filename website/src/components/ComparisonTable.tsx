import React from 'react';
import { Check, X, Zap } from 'lucide-react';

interface Row {
  feature: string;
  bytemap: string;
  bytemapOk: boolean;
  windirstat: string;
  windirstatOk: boolean;
  commercial: string;
  commercialOk: boolean;
}

const rows: Row[] = [
  {
    feature: 'Visual Interface',
    bytemap: 'Vibrant Pop-Art & Bangers Typography',
    bytemapOk: true,
    windirstat: 'Cluttered 1998 Windows 95 UI',
    windirstatOk: false,
    commercial: 'Generic dark corporate dashboards',
    commercialOk: false,
  },
  {
    feature: 'Engine & Traversal',
    bytemap: 'Native Rust 2021 + Rayon Multithreading',
    bytemapOk: true,
    windirstat: 'Single-threaded legacy C++',
    windirstatOk: false,
    commercial: 'Heavy Node.js / Electron wrappers',
    commercialOk: false,
  },
  {
    feature: 'Privacy & Storage Policy',
    bytemap: 'Strict 100% Volatile RAM (Wiped on Exit)',
    bytemapOk: true,
    windirstat: 'No telemetry, but saves raw logs',
    windirstatOk: true,
    commercial: 'Continuous tracking & upsell telemetry',
    commercialOk: false,
  },
  {
    feature: 'Duplicate Detection',
    bytemap: '3-Stage BLAKE3 Cryptographic Hash',
    bytemapOk: true,
    windirstat: 'None (must visually guess blocks)',
    windirstatOk: false,
    commercial: 'Basic filename match (causes errors)',
    commercialOk: false,
  },
  {
    feature: 'Platform Support',
    bytemap: 'Windows 10/11 & macOS (Apple Silicon + Intel)',
    bytemapOk: true,
    windirstat: 'Windows only (legacy Win32)',
    windirstatOk: false,
    commercial: 'Separate paid subscription per OS',
    commercialOk: false,
  },
  {
    feature: 'Deletion Safety',
    bytemap: 'OS Trash / Recycle Bin + System Guard',
    bytemapOk: true,
    windirstat: 'Irreversible permanent raw deletion',
    windirstatOk: false,
    commercial: 'Locks Recycle Bin behind paid Pro tier',
    commercialOk: false,
  },
  {
    feature: 'Installer Size & RAM',
    bytemap: '~15 MB Installer • <95 MB Memory',
    bytemapOk: true,
    windirstat: 'Lightweight (~1 MB) but freezes on large disks',
    windirstatOk: false,
    commercial: '250 MB+ Installer • 800 MB+ RAM',
    commercialOk: false,
  },
  {
    feature: 'Licensing & Cost',
    bytemap: '100% Free & Open Source (MIT)',
    bytemapOk: true,
    windirstat: 'Free (GPL, mostly unmaintained)',
    windirstatOk: true,
    commercial: '$29.99 - $59.99 / Year Subscription',
    commercialOk: false,
  },
];

export const ComparisonTable: React.FC = () => {
  return (
    <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 bg-sky-50 border-t-3 border-slate-900 relative">
      <div className="absolute inset-0 bg-comic-dots opacity-25 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900 mb-3">
            <Zap className="w-4 h-4 text-slate-900" />
            <span>Side-by-Side Comparison</span>
          </div>
          <h2 className="font-bangers text-4xl sm:text-5xl md:text-6xl text-slate-900 uppercase tracking-wide">
            WHY USERS ARE SWITCHING TO BYTEMAP
          </h2>
          <p className="max-w-2xl mx-auto font-comicNeue text-base sm:text-lg font-bold text-slate-700 mt-2">
            See how ByteMap’s lightweight native architecture compares to legacy analyzers and commercial bloatware.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-3 border-slate-900 bg-sky-400 text-slate-900 font-bangers text-lg uppercase tracking-wider">
                  <th className="p-4 sm:p-5 w-1/4">Key Capability</th>
                  <th className="p-4 sm:p-5 w-1/3 bg-amber-400 border-x-2.5 border-slate-900 relative">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">⭐</span>
                      <span>ByteMap (v1.0.6)</span>
                    </div>
                  </th>
                  <th className="p-4 sm:p-5 w-1/5 text-slate-800">Legacy WinDirStat</th>
                  <th className="p-4 sm:p-5 w-1/5 text-slate-800">Commercial Cleaners</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-900 font-comicNeue font-bold text-xs sm:text-sm text-slate-800">
                {rows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                  >
                    <td className="p-4 sm:p-5 font-comic text-xs uppercase text-slate-900 font-extrabold">
                      {row.feature}
                    </td>

                    {/* ByteMap Column */}
                    <td className="p-4 sm:p-5 bg-amber-50/80 border-x-2.5 border-slate-900 text-slate-900">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-400 border border-slate-900 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Check className="w-3.5 h-3.5 text-slate-900" />
                        </div>
                        <span className="font-extrabold text-slate-950">{row.bytemap}</span>
                      </div>
                    </td>

                    {/* WinDirStat Column */}
                    <td className="p-4 sm:p-5 text-slate-600">
                      <div className="flex items-start space-x-2">
                        {row.windirstatOk ? (
                          <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-slate-700" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-rose-100 border border-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-rose-600" />
                          </div>
                        )}
                        <span>{row.windirstat}</span>
                      </div>
                    </td>

                    {/* Commercial Column */}
                    <td className="p-4 sm:p-5 text-slate-600">
                      <div className="flex items-start space-x-2">
                        {row.commercialOk ? (
                          <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-slate-700" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-rose-100 border border-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-rose-600" />
                          </div>
                        )}
                        <span>{row.commercial}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
