# 🧭 ByteMap Survival Guide — Written by Ankit Pandey

> *"I build products. Life? Still in debugging mode."* — **Ankit Pandey** (Creator & Lead Architect)

Hey! I'm Ankit. If you have ever stared at a red storage bar on your Windows laptop with panic, or wondered where 40 GB vanished overnight, this handbook is for you.

I built **ByteMap** because I got sick of disk analyzer software from 1998 that feels clunky, spams you with upgrade ads, or quietly dumps gigabytes of SQLite database files onto your SSD just to show a pie chart. I wanted something native, blazingly fast in Rust, visual, and dead simple to use for everyone—from my non-tech friends to software developers.

Here is my honest, practical, no-BS guide on how to fix your storage headaches in under 2 minutes.

---

## 📑 Quick Navigation
1. [The 30-Second Explanation: How ByteMap Thinks](#-the-30-second-explanation-how-bytemap-thinks)
2. [My 6 Step-by-Step Fixes for Everyday Storage Nightmares](#-my-6-step-by-step-fixes-for-everyday-storage-nightmares)
   - [Fix 1: "C: Drive in the red? Here is my 60-second emergency fix"](#fix-1-c-drive-in-the-red-here-is-my-60-second-emergency-fix)
   - [Fix 2: "Where the heck did 30 GB disappear overnight? (My Time Machine trick)"](#fix-2-where-the-heck-did-30-gb-disappear-overnight-my-time-machine-trick)
   - [Fix 3: "Duplicate clones & copies scattered everywhere? Let's kill them"](#fix-3-duplicate-clones--copies-scattered-everywhere-lets-kill-them)
   - [Fix 4: "Can I delete this without blowing up Windows? (Yes, and here's why)"](#fix-4-can-i-delete-this-without-blowing-up-windows-yes-and-heres-why)
   - [Fix 5: "Developer pain: node_modules & build caches eating 60 GB"](#fix-5-developer-pain-node_modules--build-caches-eating-60-gb)
   - [Fix 6: "Need to show an IT tech or friend what's on your drive?"](#fix-6-need-to-show-an-it-tech-or-friend-whats-on-your-drive)
3. [Safety Guarantees (Why ByteMap won't brick your PC)](#-safety-guarantees-why-bytemap-wont-brick-your-pc)
4. [Pro Keyboard Controls & Display Scaling](#-pro-keyboard-controls--display-scaling)
5. [Connect With Me](#-connect-with-me)

---

## ⚡ The 30-Second Explanation: How ByteMap Thinks

Windows File Explorer is terrible at showing storage because it refuses to calculate folder sizes without right-clicking each one individually.

**Here is what I did differently in ByteMap:**
- **I visualize files as rectangles:** Every file and folder on your drive is mapped as a colorful block. **The bigger the box on your screen, the more gigabytes it hogs on your drive.**
- **Color Coding:**
  - 🟦 **Blue** = Videos & Movies
  - 🟥 **Red** = Apps & Executables
  - 🟪 **Pink** = Photos & Images
  - 🟩 **Green** = Documents & PDFs
  - 🟨 **Yellow** = Compressed Archives (.zip, .rar)
- **Zero Disk Residue Policy:** When you close ByteMap, all scan data in RAM disappears instantly. No SQLite caches, no background services, no junk left behind.

---

## 🚨 My 6 Step-by-Step Fixes for Everyday Storage Nightmares

### Fix 1: "C: Drive in the red? Here is my 60-second emergency fix"
* **The Annoying Symptom:** You open File Explorer and your C: drive has that angry red bar. Apps start crashing, games won't update, and Windows feels like it's walking through mud.
* **Why this happens:** Windows needs at least 15–20 GB of breathing room for virtual memory (pagefile), crash dumps, and updates. When your free space drops below 10%, Windows literally chokes.
* **How I fix it in ByteMap:**
  1. Click the big yellow **ANALYZE** button at the top to scan your C: drive.
  2. Look at my **Digital Kingdom** map in the center. The largest blocks will jump right out at you.
  3. Click **Large Files** in the top bar. Use the filter pills (`>1GB` or `>500MB`) to immediately identify forgotten 4K video exports, OBS recordings, or game ISOs.
  4. Click the folder icon `↗` to reveal the file in Windows File Explorer and delete or move it to a backup drive.
  5. Go to the **Cleanup** tab and sweep away temporary installers with one click.

---

### Fix 2: "Where the heck did 30 GB disappear overnight? (My Time Machine trick)"
* **The Annoying Symptom:** You had 50 GB free yesterday. You didn't download anything huge, but today you're down to 10 GB. What happened?
* **Why this happens:** This drove me crazy too. Windows secretly dumps massive rollback updates, or Steam/Epic pre-allocates giant staging files in hidden `AppData` folders.
* **How I catch it using Time Machine:**
  1. Run a quick scan on your drive.
  2. Click the **Time Machine** button right above the Interactive Map.
  3. If you saved a baseline snapshot earlier, ByteMap compares byte-for-byte and shows you the **EXACT swollen folders with changes over 5 MB**. You will instantly see: *"AppData\Local\Temp expanded by +14.2 GB"*.
  4. **Pro tip from me:** Click **Save Baseline Snapshot** today! That way, whenever mystery storage vanishes next week or next month, you'll have an instant comparison point.

---

### Fix 3: "Duplicate clones & copies scattered everywhere? Let's kill them"
* **The Annoying Symptom:** You downloaded the same photos, movies, or zip files 3 times across Downloads, Desktop, and backup folders.
* **Why this happens:** Renaming a file doesn't trick ByteMap. Normal tools only look at file names, but I coded ByteMap to calculate mathematical **BLAKE3 cryptographic hashes**. If the digital fingerprints match, they are 100% identical byte-for-byte.
* **How to prune duplicates:**
  1. Click the **Duplicates** tab in the top bar.
  2. ByteMap groups your clones side-by-side, marks the original, and flags the safe-to-prune duplicates.
  3. Select the duplicate copies and click **Clean Selected** to reclaim instant gigabytes without second-guessing.

---

### Fix 4: "Can I delete this without blowing up Windows? (Yes, and here's why)"
* **The Annoying Symptom:** You want to free up space, but you're terrified you might delete a system file and brick your PC.
* **Why you are safe with ByteMap:** I built ByteMap with very strict conservative rules. It will **never** recommend critical Windows boot files or system libraries.
* **How to clean safely:**
  1. Click the **Cleanup** tab.
  2. Review my risk badges:
     - `SAFE` (Green): Temporary cache files and obsolete installers you installed months ago. 100% safe.
     - `LOW RISK` (Blue): Extracted archives that you already unpacked.
     - `MODERATE` (Orange): Large downloads that you should glance at before removing.
  3. Select what you want to remove and click **Clean Selected**.
  4. **Safety net:** Everything goes straight to your **Windows Recycle Bin first**. If you ever change your mind, just open your Recycle Bin and click Restore!

---

### Fix 5: "Developer pain: node_modules & build caches eating 60 GB"
* **The Annoying Symptom:** You build web apps or code software, and your SSD is choked because every old project duplicates gigabytes of packages.
* **Why this happens:** As a developer myself, this was my #1 frustration. I had 30 old tutorial and client repos each hoarding 1 GB of `node_modules` or 10 GB of Rust `target/` folders.
* **How I sweep them in ByteMap:**
  1. Open the **Cleanup** tab.
  2. Click the purple **Developer Build Bloat** pill.
  3. ByteMap groups all `node_modules`, `target`, `.venv`, `.gradle`, and `dist` folders by project name.
  4. Select the stale or dead projects and wipe them.
  5. **Safety Guarantee:** Your source code files (`.ts`, `.rs`, `.py`, `.js`, `.html`) are **100% untouched**. You can re-install packages anytime with `npm install` or `cargo build`.

---

### Fix 6: "Need to show an IT tech or friend what's on your drive?"
* **The Annoying Symptom:** You need someone to help diagnose your computer, but taking 15 blurry phone camera pictures of your screen is terrible.
* **How to export a clean report:**
  1. Click **Export Report** above the map (or **Audit Report (HTML)** in the bottom dock).
  2. ByteMap instantly saves a clean standalone file: `bytemap-storage-audit-[date].html`.
  3. Email or message that file to your friend. It opens in Chrome, Edge, or Safari with interactive charts and a Top 20 Heavyweight Hogs list.
  4. Press <kbd>Ctrl + P</kbd> inside the browser to save directly as a clean PDF!

---

## 🛡️ Safety Guarantees: Why ByteMap Won't Brick Your PC

1. **Recycle Bin First:** ByteMap sends targets to the native Windows Recycle Bin. Nothing is permanently vaporized unless you deliberately change that setting.
2. **Zero Automated Deletions:** ByteMap will never delete anything silently in the background. You are always in control.
3. **Protected OS Zones:** System32, Windows bootloader, and OS core files are strictly ignored and shielded.
4. **100% Offline & Private:** ByteMap has zero tracking code. No analytics, no telemetry, no servers.

---

## ⌨️ Pro Keyboard Controls & Display Scaling

Need larger text or higher density on high-res monitors? I built a strict 5% keyboard scaling engine:

- <kbd>Ctrl</kbd> + <kbd>+</kbd> : **Zoom In (+5%)**
- <kbd>Ctrl</kbd> + <kbd>-</kbd> : **Zoom Out (-5%)**
- <kbd>Ctrl</kbd> + <kbd>0</kbd> : **Reset to 100% Standard Scale**
- Mouse users: Use the `[-] 100% [+]` pill right in the top header!
- Trackpad pinch-zoom is intentionally blocked so your screen never accidentally jumps or zooms erratically.

---

## 🤝 Connect With Me

ByteMap is an independent open-source project. If it helped you save disk space or rescued your C: drive, I'd love to hear from you:

- 🌐 **My Portfolio:** [https://ankitpandey19.vercel.app/](https://ankitpandey19.vercel.app/)
- 💻 **GitHub:** [@ankitpandey1900/ByteMap](https://github.com/ankitpandey1900/ByteMap)
- ✉️ **Email:** ankit1pandey11@gmail.com
- 🚀 **Web App Domain:** [https://bytemap.alltracker.online/](https://bytemap.alltracker.online/)

*— Ankit Pandey*
