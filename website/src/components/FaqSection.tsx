import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: 'Does ByteMap send my file names or directory paths to the internet?',
    a: 'Absolutely not. ByteMap has zero outbound network telemetry and zero background analytics. All scanning logic executes strictly on your local machine using native Rust threads. It works seamlessly on completely air-gapped computers without internet access.',
  },
  {
    q: 'Can I accidentally delete essential Windows system files?',
    a: 'No. ByteMap includes a hardcoded Security Guard that intercepts and blocks cleanup operations targeting protected operating system locations such as C:\\Windows, C:\\Program Files, root partition mounts, and system boot headers. Furthermore, target paths are canonicalized to prevent directory traversal exploits.',
  },
  {
    q: 'Can I restore files if I clean them by mistake?',
    a: 'Yes! Every cleanup operation defaults to utilizing the native Windows Recycle Bin API via the Rust `trash` crate. If you remove files and realize you still need them, open your Recycle Bin on the desktop and click Restore.',
  },
  {
    q: 'How does ByteMap find duplicates without false positives?',
    a: 'ByteMap uses a rigorous 3-stage cryptographic pipeline: 1) Group files by exact byte size; 2) Check a 4KB prefix hash to eliminate quick mismatches; 3) Compute a full BLAKE3 256-bit cryptographic digest only on collision candidates. Files are never flagged as duplicates based merely on matching filenames.',
  },
  {
    q: 'Will ByteMap write gigabytes of cache databases to my SSD?',
    a: 'Never. ByteMap operates under a strict Volatile Memory Policy. All scanned file records live strictly in system RAM while the application is active. When you quit the app, that RAM is immediately freed by the OS. No hidden SQLite databases or tracking caches exist.',
  },
  {
    q: 'Is ByteMap really 100% free and open-source?',
    a: 'Yes! ByteMap is published under the permissive MIT License. You are free to use it personally and commercially, inspect the Rust source code on GitHub, or fork and adapt it for your own workflows.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative">
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900 mb-3">
          <HelpCircle className="w-4 h-4 text-slate-900" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="font-bangers text-4xl sm:text-5xl text-slate-900 uppercase tracking-wide">
          EVERYTHING YOU WANT TO KNOW
        </h2>
        <p className="font-comicNeue text-base font-bold text-slate-700 mt-2">
          Clear answers about ByteMap’s privacy, speed, and safety mechanisms.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={faq.q}
              className="bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-comic text-sm sm:text-base uppercase text-slate-900 font-bold hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <div className={`w-8 h-8 rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0 transition-transform ${
                  isOpen ? 'bg-amber-400 rotate-180' : 'bg-slate-100'
                }`}>
                  <ChevronDown className="w-4 h-4 text-slate-900" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t-2 border-slate-900/10 font-comicNeue text-sm font-bold text-slate-600 leading-relaxed bg-amber-50/40">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
