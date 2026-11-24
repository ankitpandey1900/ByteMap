import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Keyboard,
  CheckCircle2,
  ExternalLink,
  Target,
  Zap,
  BarChart3,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ActiveTab } from '@/types';
import { api } from '@/lib/api';

interface GuideProblem {
  id: string;
  category: 'emergency' | 'hidden' | 'duplicates' | 'cleanup' | 'dev' | 'diff' | 'ai' | 'mac';
  badge: string;
  badgeColor: string;
  title: string;
  symptom: string;
  ankitsTake: string;
  solutionSteps: string[];
  recommendedTab: ActiveTab;
  tabActionLabel: string;
  safetyTip: string;
}

const GUIDE_PROBLEMS: GuideProblem[] = [
  {
    id: 'c-drive-red',
    category: 'emergency',
    badge: 'Emergency 🚨',
    badgeColor: 'bg-rose-400 text-white',
    title: 'Help! My C: Drive is glowing red and my PC is crying',
    symptom:
      'You open File Explorer and your C: drive has that scary red bar. Apps start crashing, games refuse to update, and Windows feels like it is walking through mud.',
    ankitsTake:
      'Look, Windows needs at least 15–20 GB of breathing room just to think straight (virtual memory, system paging, update staging). When free space drops below 10%, Windows literally panics. Here is how I fix it in 60 seconds:',
    solutionSteps: [
      'Hit the yellow "ANALYZE" button above to scan your main drive.',
      'Check the "Interactive Map" in the center — the giant colored blocks represent your biggest space hogs.',
      'Jump over to "Large Files" in the top bar to immediately catch 5GB+ movies, old game install ISOs, or OBS recordings you forgot about.',
      'Head to "Cleanup" — let ByteMap safely sweep away gigabytes of old temp junk and leftover installers.',
    ],
    recommendedTab: 'large-files',
    tabActionLabel: 'Jump to Large Files Scout',
    safetyTip:
      'Everything moved through ByteMap goes straight to your OS Recycle Bin / macOS Trash first, so you can always restore anything if you change your mind.',
  },
  {
    id: 'ide-caches',
    category: 'dev',
    badge: 'AI & IDE Caches 🤖',
    badgeColor: 'bg-sky-400 text-slate-900',
    title: 'AI models (Antigravity/Cursor), VS Code & package managers eating 25+ GB',
    symptom:
      'You code or run AI assistants, and your SSD is losing 20+ GB to invisible session caches, model weights, and package managers without any big files in Downloads.',
    ankitsTake:
      'Most disk tools only look at your regular Documents and Downloads. But modern developer tools (Google Antigravity, Cursor AI, VS Code, npm, pnpm, Cargo, pip) stash massive model weights, video session recordings, and unpacked tarballs in hidden user folders (.gemini, AppData, .cargo). I built the Coding & IDE Cache Purger so you can sweep them in 1 click without waiting for a full drive scan:',
    solutionSteps: [
      'Open the "Cleanup" tab in the top header.',
      'Click the "Coding & IDE Caches" pill at the top.',
      'Click the prominent "[ 🚀 Scan Developer Caches ]" button to audit your machine.',
      'Filter by category badges: All Caches, AI Models, IDE & Editors, Package Managers, or Build Systems.',
      'Select what you want to remove and click "Purge Selected". All caches are 100% safe to clear and rebuild cleanly when you run your tools next time.',
    ],
    recommendedTab: 'cleanup',
    tabActionLabel: 'Open Coding Cache Purger',
    safetyTip:
      'Purging IDE caches will never delete your source code or git repos; it only removes temporary download buffers, model weights, and session logs.',
  },
  {
    id: 'ai-llm-models',
    category: 'ai',
    badge: 'AI Models (LLMs) 🧠',
    badgeColor: 'bg-purple-500 text-white',
    title: 'Ollama, HuggingFace, LM Studio & PyTorch Models Eating 50+ GB',
    symptom:
      'You tested local AI models (Llama 3, DeepSeek, Mistral) or downloaded weights via HuggingFace/LM Studio, and your SSD is suddenly missing 50 to 100 GB.',
    ankitsTake:
      'Local AI models are massive (4 GB to 40 GB per checkpoint). They hide deep inside ~/.ollama/models, ~/.cache/huggingface/hub, or Chrome Gemini Nano storage where standard cleaners never look. I added dedicated model radar in Developer Caches so you can purge unused models safely in 1 click:',
    solutionSteps: [
      'Head to the "Cleanup" tab and open "Coding & IDE Caches".',
      'Click the "🧠 AI Models (LLM)" category filter pill.',
      'ByteMap lists all detected Ollama, HuggingFace Hub, LM Studio, PyTorch checkpoints, and Chrome on-device weights.',
      'Select the old model checkpoints you no longer run and purge them to instantly reclaim 10–50+ GB!',
    ],
    recommendedTab: 'cleanup',
    tabActionLabel: 'Open AI Model Purger',
    safetyTip:
      'Purging model weights never deletes your code or API keys. You can re-pull any model anytime via ollama pull or huggingface-cli.',
  },
  {
    id: 'drive-health',
    category: 'emergency',
    badge: 'Drive Health 📊',
    badgeColor: 'bg-amber-400 text-slate-900',
    title: 'Understanding Drive Health Badges: Safe, Rising, Heavy, and Critical',
    symptom:
      'You see status badges on your drives (🟢 SAFE, 🟡 RISING, ⚡ HEAVY, 🔥 CRITICAL) and want to know what they mean and when your SSD is in danger.',
    ankitsTake:
      'When Solid State Drives exceed 75% capacity, write speeds begin throttling and drive life decreases due to write amplification. I coded 4 clear operational stages so you know when to intervene:',
    solutionSteps: [
      'SAFE (0–49% used): Great health! Plenty of breathing room for the operating system and applications.',
      'RISING (50–74% used): Normal operational range. Good time to review old downloads if planning big game installs.',
      'HEAVY (75–89% used): Warning territory! SSD wear increases. Open "Large Files" to prune obsolete media or archives.',
      'CRITICAL (90%+ used): Danger zone! System updates and background paging will fail. Open "Cleanup" right away.',
    ],
    recommendedTab: 'drives',
    tabActionLabel: 'Check Drives Health',
    safetyTip:
      'Always keep at least 15% free space on your boot drive so native TRIM and wear-leveling can maintain peak performance.',
  },
  {
    id: 'where-space-went',
    category: 'diff',
    badge: 'Time Machine ⏱️',
    badgeColor: 'bg-amber-400 text-slate-900',
    title: 'Where the heck did 30 GB disappear overnight?',
    symptom:
      'You had 50 GB free yesterday. You did not download anything big, but today you are down to 10 GB. What happened?',
    ankitsTake:
      'This used to drive me crazy too. Operating systems secretly dump massive rollback updates, or Steam/Epic pre-allocates giant staging files in hidden AppData folders. That is literally why I coded the Time Machine:',
    solutionSteps: [
      'Run a quick scan on your drive.',
      'Click the "Time Machine" button right above the Interactive Map.',
      'If you saved a baseline snapshot earlier, ByteMap compares byte-for-byte to show you the EXACT swollen folders with changes over 5 MB.',
      'Pro tip from me: Click "Save Baseline Snapshot" right now so you always have a checkpoint to compare against next week!',
    ],
    recommendedTab: 'overview',
    tabActionLabel: 'Open Kingdom Overview',
    safetyTip:
      'Snapshots are feather-light and saved locally in your app memory. Zero files are uploaded anywhere.',
  },
  {
    id: 'spotlight-search',
    category: 'hidden',
    badge: 'Spotlight 🔍',
    badgeColor: 'bg-amber-300 text-slate-900',
    title: 'How to Find Any File Instantly with Treemap Spotlight (Cmd+F / Ctrl+F)',
    symptom:
      'You have 500,000 files on your disk and want to see where all .mp4 movies, .vhdx virtual disks, or ISO images are hiding on the interactive map.',
    ankitsTake:
      'Instead of squinting at individual blocks, I built Treemap Spotlight. Just press Ctrl+F or Cmd+F anywhere on the map to search extensions, filenames, or directories with instant electric yellow highlights and live match counters.',
    solutionSteps: [
      'Press Ctrl + F (or Cmd + F on macOS) while viewing the Interactive Map.',
      'Type any extension like .mp4, .zip, .vhdx, or a project name like docker or steam.',
      'Matching blocks instantly glow in bright neon electric yellow with a ⚡ MATCH badge. Non-matching files dim smoothly.',
      'See the live count of matching items and total aggregated storage right in the spotlight bar!',
    ],
    recommendedTab: 'overview',
    tabActionLabel: 'Open Interactive Map',
    safetyTip:
      'Spotlight search is 100% real-time and happens entirely in your computer\'s RAM.',
  },
  {
    id: 'live-sync',
    category: 'cleanup',
    badge: 'Live Sync ⚡',
    badgeColor: 'bg-emerald-400 text-slate-900',
    title: 'Instant Storage Synchronizer — No Waiting For 5-Minute Re-Scans',
    symptom:
      'In older disk tools, deleting a file meant waiting 5 minutes for the whole drive to re-scan just to see updated numbers.',
    ankitsTake:
      'I hate waiting for redundant scans. I engineered ByteMap\'s Live Storage Synchronizer so the moment you purge a file or cache, your drive gauges and charts update in memory with 0ms latency:',
    solutionSteps: [
      'Click "Clean Selected" in Cleanup or Developer Caches.',
      'ByteMap\'s Rust background worker deletes the targets safely into your OS Recycle Bin / macOS Trash.',
      'Your available space gauge increases and the pruned files disappear from memory immediately.',
      'A green celebratory banner pops up at the top showing exactly how many megabytes were freed!',
    ],
    recommendedTab: 'overview',
    tabActionLabel: 'View Kingdom Overview',
    safetyTip:
      'All storage calculations happen locally in RAM; zero data is sent to external servers.',
  },
  {
    id: 'duplicate-files',
    category: 'duplicates',
    badge: 'Clone Hunter 👯',
    badgeColor: 'bg-purple-400 text-white',
    title: 'Duplicate photos, videos, and backups scattered everywhere',
    symptom:
      'You downloaded the same photos, movies, or zip files 3 times across Downloads, Desktop, and backup folders.',
    ankitsTake:
      'Renaming a file does not fool ByteMap. Most tools only look at file names, but I coded ByteMap to calculate mathematical BLAKE3 cryptographic hashes. If the digital fingerprints match, they are 100% identical byte-for-byte.',
    solutionSteps: [
      'Click the "Duplicates" tab in the top navigation bar.',
      'ByteMap groups your clones side-by-side, marks the original, and flags the safe-to-prune duplicates.',
      'Use the "Select Safe Copies" button or check individual duplicates.',
      'Click "Move Marked to Trash Now" in the sticky floating action dock to recover instant gigabytes without second-guessing.',
    ],
    recommendedTab: 'duplicates',
    tabActionLabel: 'Jump to Duplicate Finder',
    safetyTip:
      'ByteMap guarantees 100% cryptographic verification. Two files are only flagged as duplicates if their contents are bit-for-bit identical.',
  },
  {
    id: 'safe-cleanup',
    category: 'cleanup',
    badge: 'Safe Janitor 🧹',
    badgeColor: 'bg-emerald-400 text-slate-900',
    title: 'Can I delete this, or will it break my operating system?',
    symptom:
      'You want to free up space, but you are terrified of accidentally deleting an important OS system file.',
    ankitsTake:
      'I built ByteMap with very strict conservative rules. It will NEVER recommend critical boot files or OS system libraries. Plus, everything we delete goes straight to your OS Recycle Bin / macOS Trash first!',
    solutionSteps: [
      'Click the "Cleanup" tab.',
      'Review my risk badges: Green is 100% safe (temp files & obsolete installers), Blue is low risk (extracted archives).',
      'Pick what you want to remove and hit "Clean Selected". If you ever panic, you can always open your OS Recycle Bin / macOS Trash and click Restore!',
    ],
    recommendedTab: 'cleanup',
    tabActionLabel: 'Open Safe Cleanup Station',
    safetyTip:
      'Critical system and boot files are automatically shielded and ignored to keep your machine 100% stable.',
  },
  {
    id: 'reclaim-sandbox',
    category: 'cleanup',
    badge: 'Sandbox & Scripts 🧪',
    badgeColor: 'bg-emerald-300 text-slate-900',
    title: 'What-If Reclamation Sandbox & Audit Script Generator (.ps1 / .sh)',
    symptom:
      'You want to see exactly how much your drive will open up before deleting, or you need an audited PowerShell or Bash script for IT approval.',
    ankitsTake:
      'I built the What-If Reclamation Sandbox so you can see your drive gauge visually expand in real-time as you select candidates. Plus, you can generate clean, human-auditable PowerShell (.ps1) or Bash (.sh) cleanup scripts with 1 click:',
    solutionSteps: [
      'In "Cleanup", select any combination of junk files, build bloat, or developer caches.',
      'Look at the "What-If Reclamation Sandbox" bar at the top: the striped green preview shows your projected free space expansion!',
      'Click "Generate Script (.ps1 / .sh)" to view the exact commands.',
      'Copy the script or download it to run via your terminal or save for IT compliance!',
    ],
    recommendedTab: 'cleanup',
    tabActionLabel: 'Open Reclamation Sandbox',
    safetyTip:
      'Generated scripts include safety checks and respect OS Recycle Bin / Trash deletion flags.',
  },
  {
    id: 'dev-bloat',
    category: 'dev',
    badge: 'Developer Bloat 💻',
    badgeColor: 'bg-indigo-400 text-white',
    title: 'Developer pain: node_modules & build caches eating half your SSD',
    symptom:
      'You build web apps or code software, and your SSD is choked because every old project duplicates gigabytes of packages.',
    ankitsTake:
      'As a developer myself, this was my #1 frustration. I had 30 old tutorial and client repos each hoarding 1 GB of node_modules or 10 GB of Rust target folders. I built this dedicated sweeper to solve it:',
    solutionSteps: [
      'Go to "Cleanup" and click the purple "Developer Build Bloat" pill.',
      'ByteMap groups all node_modules, target, .venv, .gradle, and dist folders by project name.',
      'Select the dead projects and wipe them. Your source code files are 100% untouched, and you can re-install packages anytime with npm install or cargo build.',
    ],
    recommendedTab: 'cleanup',
    tabActionLabel: 'Explore Developer Sweeper',
    safetyTip:
      'Deleting build folders will never touch your source code (.ts, .rs, .py, .js, .html).',
  },
  {
    id: 'empty-ghosts',
    category: 'cleanup',
    badge: 'Ghost Hunter 📁',
    badgeColor: 'bg-teal-400 text-slate-900',
    title: 'Thousands of abandoned empty folders cluttering your drive',
    symptom:
      'Uninstallers and old apps leave hundreds of nested, empty directory shells behind that make your file tree messy.',
    ankitsTake:
      'Poorly coded software deletes program files but leaves empty folder skeletons behind. I wrote this sweeper to prune zero-byte ghost files and empty directories cleanly.',
    solutionSteps: [
      'Open the "Cleanup" tab and choose the green "Empty Folders & Ghosts" sub-station.',
      'Review the detected zero-byte files and abandoned empty folders.',
      'Select and prune them with 1 click to keep your file tree neat and tidy.',
    ],
    recommendedTab: 'cleanup',
    tabActionLabel: 'Check Empty Folders',
    safetyTip:
      'Pruning empty directories speeds up OS search indexing and keeps your folder hierarchy organized.',
  },
  {
    id: 'cold-storage',
    category: 'hidden',
    badge: 'Forgotten Giants ❄️',
    badgeColor: 'bg-cyan-300 text-slate-900',
    title: 'Finding "Forgotten Giants": Huge files you haven\'t opened in over 1 year',
    symptom:
      'Your SSD is choked with giant files, but you have no idea which ones you actually need vs. files you downloaded 2 years ago and completely forgot about.',
    ankitsTake:
      'Disk space is too expensive to waste on ancient installers and old screen recordings. In "Large Files", I added smart age filters so you can filter by last modification date:',
    solutionSteps: [
      'Click "Large Files" in the top navigation bar.',
      'Notice the KPI summary cards: "Forgotten Giants (>6 Mo)" and "Cold Storage (>1 Yr)".',
      'Click the "❄️ Cold (>1 yr)" or "⏳ Stale (>6 mo)" filter pill.',
      'Every file displays a color-coded status badge showing how old it is. Open or safely trash files you no longer need!',
    ],
    recommendedTab: 'large-files',
    tabActionLabel: 'Scan Forgotten Giants',
    safetyTip:
      'ByteMap never deletes files automatically; you always have full preview and control with Recycle Bin / Trash protection.',
  },
  {
    id: 'mac-storage',
    category: 'mac',
    badge: 'macOS & APFS 🍎',
    badgeColor: 'bg-slate-800 text-white',
    title: 'macOS Storage: APFS Clones, System Data & Safe High-Speed Scanning',
    symptom:
      'On your Mac, "System Data" is taking 80 GB, or disk tools show weird scanned sizes because of APFS clones or multiple volume mounts.',
    ankitsTake:
      'macOS handles storage differently than Windows. APFS uses Copy-on-Write clones (where duplicate files share the same physical storage blocks until edited), and /Volumes mounts external drives and DMG images. I engineered ByteMap specifically for macOS:',
    solutionSteps: [
      'ByteMap never double-counts APFS clones and avoids looping into /Volumes or virtual DMG containers.',
      'macOS scanning uses high-speed batch directory queries (getattrlistbulk) that comply 100% with Apple System Integrity Protection (SIP).',
      'Deleted files move safely to macOS Trash ~/.Trash, never permanently erased without your explicit choice.',
      'Use Finder Quick Actions ("Inspect with ByteMap") or right-click any folder to scout it directly!',
    ],
    recommendedTab: 'drives',
    tabActionLabel: 'View Storage Drives',
    safetyTip:
      'ByteMap never touches protected macOS System Integrity Protection (SIP) directories like /System or read-only sealed system volumes.',
  },
  {
    id: 'text-highlight',
    category: 'hidden',
    badge: 'Yellow Highlighter 🖍️',
    badgeColor: 'bg-amber-300 text-slate-900',
    title: 'How to Copy Paths with the Comic Yellow Highlighter',
    symptom:
      'You found a rogue file and want to copy its full path or jump directly to it in File Explorer / Finder.',
    ankitsTake:
      'You do not need to manually re-type long folder paths. I enabled full text selection with a bold comic yellow marker so copying paths is effortless:',
    solutionSteps: [
      'Click and drag your mouse over any file path, size, or hash anywhere in ByteMap.',
      'The text highlights in bright comic yellow with deep ink contrast.',
      'Press Ctrl + C (or Cmd + C) to copy it directly to your clipboard.',
      'Or click the folder icon next to any file row to reveal and pre-select it directly in File Explorer or macOS Finder!',
    ],
    recommendedTab: 'explore',
    tabActionLabel: 'Open Explorer Scout',
    safetyTip:
      'Clicking the open button uses the native OS shell to reveal the file in its real folder.',
  },
  {
    id: 'html-report',
    category: 'hidden',
    badge: 'IT Audit Report 📑',
    badgeColor: 'bg-sky-400 text-slate-900',
    title: 'How to show your tech friend or IT guy what is on your drive',
    symptom:
      'You need someone to help diagnose your storage, but taking 15 blurry phone photos of your laptop screen is annoying.',
    ankitsTake:
      'Please do not take photos of your screen with your phone! I built a 1-click standalone HTML report exporter for this exact reason:',
    solutionSteps: [
      'Click "Export Report" right above the map (or "Audit Report (HTML)" in the bottom dock).',
      'ByteMap generates a self-contained .html file with visual charts and top hogs.',
      'Email or message that file to your friend. It opens in any browser and formats cleanly for PDF printing (Ctrl + P / Cmd + P)!',
    ],
    recommendedTab: 'overview',
    tabActionLabel: 'View Export Actions',
    safetyTip:
      'The audit report contains zero private personal data; it only lists file sizes, categories, and paths.',
  },
];

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  const { setActiveTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['c-drive-red']));

  if (!isOpen) return null;

  const filteredProblems = GUIDE_PROBLEMS.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.symptom.toLowerCase().includes(q) ||
      p.ankitsTake.toLowerCase().includes(q) ||
      p.badge.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(filteredProblems.map((p) => p.id)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleJumpToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs font-sans text-slate-900">
      <div className="bg-white border-3 border-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-comic-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header with Creator Avatar & Badge */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b-2.5 border-slate-900 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic overflow-hidden shrink-0">
              <img
                src="/ankit.jpg"
                alt="Ankit Pandey"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-300 border border-slate-900 text-[10px] font-comic uppercase tracking-wider text-slate-900">
                <Sparkles className="w-3 h-3 text-slate-900" />
                <span>Ankit's Handbook • Written by the Creator</span>
              </div>
              <h2 className="font-bangers text-xl sm:text-2xl uppercase tracking-wider text-slate-900 leading-tight truncate mt-0.5">
                Hey, Let's Fix Your Storage — Ankit's Survival Guide
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 transition-colors shadow-comic-sm cursor-pointer shrink-0"
            title="Close Guide"
          >
            <X className="w-5 h-5 text-slate-900" />
          </button>
        </div>

        {/* Creator Intro Note */}
        <div className="py-2 px-3 mt-2.5 bg-amber-100 rounded-2xl border-2 border-slate-900 shadow-comic-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shrink-0">
          <p className="font-fredoka font-semibold text-slate-800 leading-snug">
            👋 <strong>From Ankit:</strong> I built ByteMap because I got tired of slow, clunky disk tools from 1998 that try to install adware or spam alerts. Here is my honest, practical guide on how to clean your SSD without breaking anything.
          </p>
          <button
            type="button"
            onClick={() => api.openExternalUrl('https://ankitpandey19.vercel.app/')}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-900 font-comic uppercase text-[10px] text-slate-900 hover:bg-amber-300 transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>My Portfolio</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="py-2.5 border-b-2 border-slate-200 shrink-0 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problems (e.g., 'C drive red', 'AI models', 'duplicates', 'where did space go', 'macOS')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-comic placeholder:text-slate-400 focus:bg-amber-50 outline-none shadow-comic-sm transition-all"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Problems' },
              { id: 'emergency', label: '🚨 Emergency Full' },
              { id: 'ai', label: '🧠 AI & LLM Models' },
              { id: 'diff', label: '⏱️ Space Mystery' },
              { id: 'duplicates', label: '👯 Duplicates' },
              { id: 'cleanup', label: '🧹 Safe Junk' },
              { id: 'dev', label: '💻 Developer Bloat' },
              { id: 'mac', label: '🍎 macOS Special' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5 font-bold'
                    : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Cards List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {/* Simple Visual App Workflow Diagram (4 Simple Steps) */}
          <div className="bg-gradient-to-r from-amber-50 via-sky-50 to-blue-50 border-2.5 border-slate-900 rounded-2xl p-3 sm:p-4 shadow-comic space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center font-bangers text-xs sm:text-sm shadow-comic-sm">
                  🧭
                </div>
                <div>
                  <h3 className="font-bangers text-base sm:text-lg uppercase tracking-wider text-slate-900 leading-none">
                    How ByteMap Works — The 4-Step Recovery Workflow
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-fredoka font-semibold text-slate-600 leading-none mt-1">
                    Written by Ankit: Zero cloud uploads • 100% In-Memory Rust engine • Instant Recycle Bin / Trash recovery
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-comic font-bold uppercase text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-900 shadow-comic-sm">
                4 Simple Steps
              </span>
            </div>

            {/* 4 Step Diagram Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-900">
              <div className="bg-white rounded-xl border-2 border-slate-900 p-2.5 shadow-comic-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bangers text-[10px] text-amber-900 bg-amber-300 px-1.5 py-0.5 rounded border border-slate-900">
                    STEP 01
                  </span>
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h4 className="font-bangers text-xs sm:text-sm uppercase text-slate-900 tracking-wide">
                  1. Pick Target
                </h4>
                <p className="font-fredoka text-[11px] font-semibold text-slate-600 leading-tight">
                  Choose your main drive or browse to any folder (Downloads, games, or work repos) to inspect.
                </p>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-900 p-2.5 shadow-comic-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bangers text-[10px] text-sky-900 bg-sky-300 px-1.5 py-0.5 rounded border border-slate-900">
                    STEP 02
                  </span>
                  <Zap className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <h4 className="font-bangers text-xs sm:text-sm uppercase text-slate-900 tracking-wide">
                  2. Hit Analyze
                </h4>
                <p className="font-fredoka text-[11px] font-semibold text-slate-600 leading-tight">
                  Multi-core Rust engine walks millions of files in RAM in seconds without spinning disks needlessly.
                </p>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-900 p-2.5 shadow-comic-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bangers text-[10px] text-purple-900 bg-purple-300 px-1.5 py-0.5 rounded border border-slate-900">
                    STEP 03
                  </span>
                  <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <h4 className="font-bangers text-xs sm:text-sm uppercase text-slate-900 tracking-wide">
                  3. Spot Space Hogs
                </h4>
                <p className="font-fredoka text-[11px] font-semibold text-slate-600 leading-tight">
                  Giant interactive blocks & rankers reveal hidden gigabytes, obsolete installers, and duplicate clones.
                </p>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-900 p-2.5 shadow-comic-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bangers text-[10px] text-emerald-900 bg-emerald-300 px-1.5 py-0.5 rounded border border-slate-900">
                    STEP 04
                  </span>
                  <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <h4 className="font-bangers text-xs sm:text-sm uppercase text-slate-900 tracking-wide">
                  4. Safe 1-Click Clean
                </h4>
                <p className="font-fredoka text-[11px] font-semibold text-slate-600 leading-tight">
                  Clean to OS Recycle Bin / macOS Trash, purge IDE/AI session caches, and watch space recover live!
                </p>
              </div>
            </div>
          </div>

          {/* Quick Accordion Toolbar */}
          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <span className="font-comic uppercase text-[11px] text-slate-600 font-bold">
              Showing {filteredProblems.length} Topics
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-[11px] font-comic uppercase text-slate-700 hover:text-slate-900 underline cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-slate-400">•</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-[11px] font-comic uppercase text-slate-700 hover:text-slate-900 underline cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Collapsible Accordion Problem Cards */}
          {filteredProblems.length > 0 ? (
            filteredProblems.map((p) => {
              const isExpanded = searchQuery.trim().length > 0 || expandedIds.has(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => toggleExpand(p.id)}
                  className={`rounded-2xl border-2.5 border-slate-900 transition-all cursor-pointer select-none ${
                    isExpanded
                      ? 'p-4 bg-white shadow-comic'
                      : 'p-3 bg-slate-50 hover:bg-amber-50 shadow-comic-sm'
                  }`}
                >
                  {/* Card Header Bar (Click to toggle) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span
                        className={`px-2 py-0.5 rounded-lg border border-slate-900 text-[10px] font-comic uppercase tracking-wider font-bold shadow-comic-sm shrink-0 ${p.badgeColor}`}
                      >
                        {p.badge}
                      </span>
                      <h3 className="font-bangers text-base sm:text-lg uppercase tracking-wider text-slate-900 leading-tight truncate">
                        {p.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJumpToTab(p.recommendedTab);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-[11px] sm:text-xs uppercase shadow-comic transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        title={`Jump directly to ${p.tabActionLabel}`}
                      >
                        <span>{p.tabActionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div className="p-1 rounded-lg border border-slate-900 bg-white text-slate-700 shadow-xs">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body (Clean 2-row layout without color explosion) */}
                  {isExpanded && (
                    <div
                      className="mt-3 pt-3 border-t-2 border-slate-200 space-y-2.5 cursor-default animate-comic-pop"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1. Context Row: Symptom & Ankit's Take */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 bg-amber-50/60 border-1.5 border-slate-900 rounded-xl space-y-1">
                          <span className="font-comic uppercase text-[10px] text-amber-900 font-bold block">
                            The Annoying Symptom:
                          </span>
                          <p className="font-fredoka font-semibold text-slate-800 leading-relaxed">
                            {p.symptom}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-100/70 border-1.5 border-slate-900 rounded-xl space-y-1">
                          <span className="font-comic uppercase text-[10px] text-slate-700 font-bold block">
                            Ankit's Take (Why this happens):
                          </span>
                          <p className="font-fredoka font-semibold text-slate-800 leading-relaxed">
                            {p.ankitsTake}
                          </p>
                        </div>
                      </div>

                      {/* 2. Step-by-Step Fix in ByteMap */}
                      <div className="p-3 bg-white border-1.5 border-slate-900 rounded-xl space-y-1.5">
                        <span className="font-comic uppercase text-[10px] text-slate-900 font-bold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>How I Solve It Step-by-Step in ByteMap:</span>
                        </span>
                        <ol className="space-y-1 pl-4 list-decimal text-xs font-fredoka font-semibold text-slate-800 leading-relaxed">
                          {p.solutionSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* 3. Safety Guarantee Badge */}
                      <div className="flex items-center space-x-2 text-[11px] font-fredoka font-bold text-emerald-950 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-400 shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="leading-snug">Ankit's Safety Guarantee: {p.safetyTip}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-comic space-y-2">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-comic text-sm uppercase text-slate-800">No matching problem found</h4>
              <p className="text-xs font-fredoka text-slate-500">
                Try searching for "duplicates", "AI models", "temp files", "installers", or "disk full".
              </p>
            </div>
          )}

          {/* Quick Shortcuts & Zoom Section */}
          <div className="bg-amber-100 rounded-2xl border-2.5 border-slate-900 p-3 sm:p-4 shadow-comic space-y-2">
            <div className="flex items-center space-x-2">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
              <h4 className="font-bangers text-base sm:text-lg uppercase tracking-wider text-slate-900">
                Pro Keyboard & Display Zoom Controls
              </h4>
            </div>
            <p className="text-xs font-fredoka font-semibold text-slate-700">
              Need larger text, higher density, or instant search? Use these cross-platform shortcuts anywhere in ByteMap:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-white border border-slate-900 rounded-xl shadow-comic-sm">
                <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-900 rounded text-[11px] font-mono font-bold">
                  Ctrl / ⌘ +
                </kbd>
                <span className="ml-2 font-comic uppercase text-[10px] sm:text-[11px] block sm:inline mt-1 sm:mt-0">
                  Zoom In (+5%)
                </span>
              </div>
              <div className="p-2 bg-white border border-slate-900 rounded-xl shadow-comic-sm">
                <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-900 rounded text-[11px] font-mono font-bold">
                  Ctrl / ⌘ -
                </kbd>
                <span className="ml-2 font-comic uppercase text-[10px] sm:text-[11px] block sm:inline mt-1 sm:mt-0">
                  Zoom Out (-5%)
                </span>
              </div>
              <div className="p-2 bg-white border border-slate-900 rounded-xl shadow-comic-sm">
                <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-900 rounded text-[11px] font-mono font-bold">
                  Ctrl / ⌘ 0
                </kbd>
                <span className="ml-2 font-comic uppercase text-[10px] sm:text-[11px] block sm:inline mt-1 sm:mt-0">
                  Reset 100%
                </span>
              </div>
              <div className="p-2 bg-amber-300 border border-slate-900 rounded-xl shadow-comic-sm">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-900 rounded text-[11px] font-mono font-bold">
                  Ctrl / ⌘ F
                </kbd>
                <span className="ml-2 font-comic uppercase text-[10px] sm:text-[11px] font-bold block sm:inline mt-1 sm:mt-0">
                  Spotlight
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Ankit's Signature Quote */}
        <div className="pt-2.5 sm:pt-3 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-900 shrink-0">
              <img src="/ankit.jpg" alt="Ankit Pandey" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-fredoka font-bold text-slate-700 text-center sm:text-left">
              "I build products. Life? Still in debugging mode." — Ankit Pandey
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase tracking-wider shadow-comic cursor-pointer transition-all hover:-translate-y-0.5 shrink-0"
          >
            Got it Ankit, Let's Scout!
          </button>
        </div>
      </div>
    </div>
  );
};
