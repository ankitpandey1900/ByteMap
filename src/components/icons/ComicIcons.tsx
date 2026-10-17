import React from 'react';

export interface ComicIconProps {
  className?: string;
}

/**
 * 🗺️ Comic Kingdom / Treasure Map Icon
 * Folded explorer parchment map with dotted trail and red X
 */
export const ComicKingdomIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Map Parchment panels */}
    <path
      d="M3 6.5L8.5 4.5L15.5 7L21 4.5V18L15.5 20.5L8.5 18L3 20V6.5Z"
      fill="#fef08a"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Panel folds */}
    <path d="M8.5 4.5V18" stroke="#0f172a" strokeWidth="1.8" />
    <path d="M15.5 7V20.5" stroke="#0f172a" strokeWidth="1.8" />
    {/* Dotted explorer path */}
    <path
      d="M5.5 14C7.5 12 10 14 12 11"
      stroke="#d97706"
      strokeWidth="1.8"
      strokeDasharray="2 2"
      strokeLinecap="round"
    />
    {/* Red X marks the spot */}
    <path d="M17 11L20 14M20 11L17 14" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/**
 * 💾 Comic Drive Icon
 * Retro chunky 3.5" floppy disk with metallic shutter and cartoon label
 */
export const ComicDrivesIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Disk Body */}
    <path
      d="M4 4H18L21 7V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V5C3 4.4 3.4 4 4 4Z"
      fill="#38bdf8"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Metal Shutter */}
    <rect x="7" y="4" width="10" height="7" rx="1" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.8" />
    <rect x="13" y="5.5" width="2.5" height="4" rx="0.5" fill="#0f172a" />
    {/* Paper Label */}
    <rect x="6" y="14" width="12" height="7" rx="1" fill="#fef9c3" stroke="#0f172a" strokeWidth="1.8" />
    <line x1="8" y1="16.5" x2="16" y2="16.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="18.5" x2="13" y2="18.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * 🔍 Comic Explore Icon
 * Chunky magnifying glass with glossy cyan lens and shine line
 */
export const ComicExploreIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Handle */}
    <path d="M15 15L21.5 21.5" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M15 15L21.5 21.5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    {/* Lens Rim */}
    <circle cx="10" cy="10" r="7.5" fill="#e0f2fe" stroke="#0f172a" strokeWidth="2.2" />
    {/* Lens Glow */}
    <circle cx="10" cy="10" r="5.5" fill="#38bdf8" fillOpacity="0.3" />
    {/* White Specular Shine */}
    <path d="M7 7C8 6 11 6 12 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * 📁 Comic Large Files / Folder Icon
 * Overstuffed manila folder with papers peaking out
 */
export const ComicLargeFilesIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Back tab */}
    <path d="M3 7C3 6 4 5 5 5H9L11 7H19C20 7 21 8 21 9V18H3V7Z" fill="#d97706" stroke="#0f172a" strokeWidth="2" />
    {/* White Paper Sheet Sticking Out */}
    <rect x="6" y="4" width="12" height="7" rx="1" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
    {/* Front Folder Flap (Angled) */}
    <path
      d="M2 10H22L20 20C20 20.6 19.4 21 18.8 21H3.2C2.6 21 2 20.6 2 20V10Z"
      fill="#facc15"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <line x1="5" y1="14" x2="11" y2="14" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * 📑 Comic Duplicates Icon
 * Twin overlapping document sheets with matching stamps
 */
export const ComicDuplicatesIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Back Sheet */}
    <rect x="7" y="3" width="13" height="15" rx="2" fill="#bae6fd" stroke="#0f172a" strokeWidth="2" />
    {/* Front Sheet */}
    <rect x="4" y="6" width="13" height="15" rx="2" fill="#fef08a" stroke="#0f172a" strokeWidth="2" />
    {/* Twin Checkmarks */}
    <path d="M7 13L9 15L14 10" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="7" y1="18" x2="14" y2="18" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * 🧹 Comic Cleanup / Broom Icon
 * Cartoon sweeper broom with motion dust sweeps and sparkle
 */
export const ComicCleanupIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Broom Handle */}
    <path d="M19 3L11 11" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M19 3L11 11" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
    {/* Straw Bristles */}
    <path
      d="M11 11L6 14C5 17 4 19 3 21C6 21 11 20 14 18L13 13L11 11Z"
      fill="#facc15"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Bristle Band */}
    <line x1="8" y1="13" x2="13" y2="15" stroke="#ef4444" strokeWidth="2.2" />
    {/* Sparkle Clean Star */}
    <path d="M18 17L19 19L21 20L19 21L18 23L17 21L15 20L17 19Z" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
  </svg>
);

/**
 * ⚙️ Comic Settings / Gear Icon
 * Chunky cartoon mechanical cog with bold teeth and central nut
 */
export const ComicSettingsIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Gear Base Outer */}
    <path
      d="M12 2C11.3 2 10.7 2.4 10.6 3.1L10.3 4.4C9.7 4.7 9.1 5 8.6 5.5L7.4 4.8C6.8 4.4 6 4.6 5.6 5.2L4.2 7.6C3.8 8.2 4 9 4.6 9.4L5.6 10.2C5.5 10.8 5.5 11.4 5.6 12L4.6 12.8C4 13.2 3.8 14 4.2 14.6L5.6 17C6 17.6 6.8 17.8 7.4 17.4L8.6 16.7C9.1 17.1 9.7 17.5 10.3 17.8L10.6 19.1C10.7 19.8 11.3 20.2 12 20.2H14.8C15.5 20.2 16.1 19.8 16.2 19.1L16.5 17.8C17.1 17.5 17.7 17.1 18.2 16.7L19.4 17.4C20 17.8 20.8 17.6 21.2 17L22.6 14.6C23 14 22.8 13.2 22.2 12.8L21.2 12C21.3 11.4 21.3 10.8 21.2 10.2L22.2 9.4C22.8 9 23 8.2 22.6 7.6L21.2 5.2C20.8 4.6 20 4.4 19.4 4.8L18.2 5.5C17.7 5 17.1 4.7 16.5 4.4L16.2 3.1C16.1 2.4 15.5 2 14.8 2H12Z"
      fill="#cbd5e1"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Center Hole */}
    <circle cx="13.4" cy="11.1" r="3.5" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

/**
 * ⚡ Comic Zap / Lightning Bolt Icon
 * Explosive comic action bolt with dual yellow/orange gradient
 */
export const ComicZapIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[2px_2px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      fill="#facc15"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Inner Orange Core */}
    <path d="M12.5 5L6 13H11.5L11 18L17.5 11H12L12.5 5Z" fill="#f97316" opacity="0.6" />
  </svg>
);

/**
 * 🎬 Comic Video / Movie Clapperboard Icon
 */
export const ComicVideoIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Board Body */}
    <rect x="3" y="7" width="18" height="14" rx="2" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
    {/* Film Clapper Top */}
    <path d="M3 7L21 7" stroke="#0f172a" strokeWidth="2.5" />
    <path d="M3 4H21V7H3V4Z" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2" />
    {/* Diagonal Striped Stripes */}
    <path d="M6 4L9 7M11 4L14 7M16 4L19 7" stroke="#ffffff" strokeWidth="1.8" />
    {/* Play Triangle in center */}
    <path d="M10 11L15 14L10 17V11Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

/**
 * ⚙️ Comic App / Executable Icon
 * Cartoon terminal / app window with candy red header
 */
export const ComicAppIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="4" width="18" height="16" rx="3" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
    {/* Inner Screen */}
    <rect x="5" y="8" width="14" height="10" rx="1.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
    {/* Terminal Command Prompt */}
    <path d="M8 11L10 13L8 15" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="15" x2="15" y2="15" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    {/* Header Dots */}
    <circle cx="6" cy="6" r="0.8" fill="#ffffff" />
    <circle cx="8" cy="6" r="0.8" fill="#ffffff" />
  </svg>
);

/**
 * 📄 Comic Document Icon
 */
export const ComicDocIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 3H14L19 8V20C19 20.6 18.6 21 18 21H5C4.4 21 4 20.6 4 20V4C4 3.4 4.4 3 5 3Z"
      fill="#10b981"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Folded Corner */}
    <path d="M14 3V8H19" fill="#34d399" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Document Text Lines */}
    <line x1="7" y1="12" x2="15" y2="12" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="7" y1="15" x2="13" y2="15" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * 🖼️ Comic Image Icon
 * Instant polaroid photo with mountains and sun
 */
export const ComicImageIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#ec4899" stroke="#0f172a" strokeWidth="2" />
    {/* Image Canvas */}
    <rect x="5.5" y="5.5" width="13" height="11" rx="1" fill="#fdf2f8" stroke="#0f172a" strokeWidth="1.5" />
    {/* Sun */}
    <circle cx="8.5" cy="8.5" r="1.5" fill="#facc15" stroke="#0f172a" strokeWidth="1.2" />
    {/* Mountains */}
    <path
      d="M7 15L10 11L13 14L15 12L17.5 15H7Z"
      fill="#ec4899"
      stroke="#0f172a"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 📦 Comic Archive / Box Icon
 */
export const ComicArchiveIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Box Body */}
    <path
      d="M3 8L12 3L21 8L12 13L3 8Z"
      fill="#fde047"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M3 8V16L12 21V13L3 8Z"
      fill="#f59e0b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M21 8V16L12 21V13L21 8Z"
      fill="#d97706"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Center tape stripe */}
    <line x1="12" y1="3" x2="12" y2="13" stroke="#0f172a" strokeWidth="1.6" strokeDasharray="2 1" />
  </svg>
);

/**
 * 🗑️ Comic Trash Can Icon
 */
export const ComicTrashIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Can Body */}
    <path
      d="M5 8L6.5 20C6.6 20.6 7 21 7.6 21H16.4C17 21 17.4 20.6 17.5 20L19 8H5Z"
      fill="#f87171"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Fluted ridges on bin */}
    <line x1="9.5" y1="11" x2="9.5" y2="18" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="14.5" y1="11" x2="14.5" y2="18" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
    {/* Bouncy Lid */}
    <path
      d="M3 8H21L19 6H5L3 8Z"
      fill="#ef4444"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Handle on top */}
    <path d="M10 6V4C10 3.5 10.5 3 11 3H13C13.5 3 14 3.5 14 4V6" stroke="#0f172a" strokeWidth="1.8" />
  </svg>
);

/**
 * 📊 Comic Pie Chart Icon
 */
export const ComicPieChartIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main Pie Body */}
    <path
      d="M12 21C16.97 21 21 16.97 21 12H12V3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21Z"
      fill="#38bdf8"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Popped Out Slice */}
    <path
      d="M14 2.5C18 3.5 21 6.5 21.5 10.5H14V2.5Z"
      fill="#ef4444"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 🛡️ Comic Shield Icon
 */
export const ComicShieldIcon: React.FC<ComicIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.9)] overflow-visible`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L4 5V11C4 16.5 7.4 21.6 12 22C16.6 21.6 20 16.5 20 11V5L12 2Z"
      fill="#10b981"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Checkmark in shield */}
    <path
      d="M8.5 11.5L11 14L15.5 9.5"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
