import { ScanSummary, AppSettings, DriveInfo } from '@/types';
import { formatBytes } from './utils';

export function exportStorageAuditHtml(
  scanSummary: ScanSummary,
  settings: AppSettings,
  drive?: DriveInfo | null
): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const driveLabel = drive ? `${drive.name} (${drive.mount_point})` : 'Target Root';

  const totalReclaimable = scanSummary.cleanup_candidates.reduce(
    (acc, c) => acc + c.file.size_bytes,
    0
  );

  const categoriesRows = scanSummary.categories
    .map(
      (cat) => `
      <tr>
        <td style="font-weight: 700; text-transform: uppercase;">${cat.category}</td>
        <td style="font-family: monospace;">${cat.file_count.toLocaleString()}</td>
        <td style="font-family: monospace; font-weight: 700;">${formatBytes(cat.total_bytes, settings.unit)}</td>
        <td>
          <div style="background: #e2e8f0; border-radius: 9999px; overflow: hidden; height: 10px; width: 100%;">
            <div style="background: #f59e0b; height: 100%; width: ${cat.percentage.toFixed(1)}%;"></div>
          </div>
        </td>
        <td style="font-family: monospace; font-weight: 700;">${cat.percentage.toFixed(1)}%</td>
      </tr>`
    )
    .join('');

  const largestFilesRows = scanSummary.largest_files
    .slice(0, 20)
    .map(
      (f, idx) => `
      <tr>
        <td style="font-weight: 800; color: #475569;">#${idx + 1}</td>
        <td style="font-weight: 700; word-break: break-all;">${escapeHtml(f.name)}</td>
        <td style="text-transform: uppercase; font-size: 11px;">
          <span style="background: #fef3c7; border: 1.5px solid #0f172a; padding: 2px 6px; border-radius: 6px;">${f.category}</span>
        </td>
        <td style="font-family: monospace; font-weight: 700; text-align: right;">${formatBytes(f.size_bytes, settings.unit)}</td>
        <td style="font-family: monospace; font-size: 11px; color: #64748b; word-break: break-all;">${escapeHtml(f.path)}</td>
      </tr>`
    )
    .join('');

  const largestFoldersRows = (scanSummary.largest_folders || [])
    .slice(0, 15)
    .map(
      (f, idx) => `
      <tr>
        <td style="font-weight: 800; color: #475569;">#${idx + 1}</td>
        <td style="font-weight: 700; word-break: break-all;">${escapeHtml(f.name)}</td>
        <td style="font-family: monospace;">${f.file_count.toLocaleString()}</td>
        <td style="font-family: monospace; font-weight: 700; text-align: right;">${formatBytes(f.size_bytes, settings.unit)}</td>
        <td style="font-family: monospace; font-size: 11px; color: #64748b; word-break: break-all;">${escapeHtml(f.path)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ByteMap Storage Audit — ${escapeHtml(scanSummary.root_path)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    .card {
      background: #ffffff;
      border: 2.5px solid #0f172a;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 4px 4px 0px #0f172a;
    }
    .header-badge {
      display: inline-block;
      background: #f59e0b;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1.5px solid #0f172a;
      margin-bottom: 12px;
    }
    h1 {
      font-family: 'Bangers', cursive;
      font-size: 38px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 6px;
      color: #0f172a;
    }
    h2 {
      font-family: 'Bangers', cursive;
      font-size: 24px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      margin-bottom: 14px;
      color: #0f172a;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .meta-box {
      background: #f1f5f9;
      border: 1.5px solid #0f172a;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 2px 2px 0px #0f172a;
    }
    .meta-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .meta-val {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #f1f5f9;
      border: 1.5px solid #0f172a;
      padding: 10px 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #0f172a;
    }
    td {
      border: 1.5px solid #0f172a;
      padding: 10px 12px;
      font-size: 13px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .badge-chip {
      background: #fef08a;
      border: 1.5px solid #0f172a;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }
    .print-btn {
      background: #38bdf8;
      border: 2px solid #0f172a;
      padding: 8px 16px;
      border-radius: 12px;
      font-family: 'Bangers', cursive;
      font-size: 16px;
      letter-spacing: 0.05em;
      cursor: pointer;
      box-shadow: 3px 3px 0px #0f172a;
      float: right;
    }
    .print-btn:hover { background: #0ea5e9; color: white; }
    @media print {
      body { background: white; padding: 0; }
      .card { box-shadow: none; border-width: 1px; margin-bottom: 16px; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
      <div class="header-badge">ByteMap Storage Intelligence</div>
      <h1>Drive Storage Audit Report</h1>
      <p style="font-size: 13px; color: #475569;">
        Generated on <strong>${dateStr} at ${timeStr}</strong> • Target: <strong>${escapeHtml(driveLabel)}</strong> (<code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${escapeHtml(scanSummary.root_path)}</code>)
      </p>

      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">Total Storage Scanned</div>
          <div class="meta-val">${formatBytes(scanSummary.total_bytes, settings.unit)}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Total Files & Folders</div>
          <div class="meta-val">${scanSummary.total_files.toLocaleString()} / ${scanSummary.total_directories.toLocaleString()}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Reclaimable Candidates</div>
          <div class="meta-val" style="color: #d97706;">${formatBytes(totalReclaimable, settings.unit)}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Scan Duration</div>
          <div class="meta-val">${(scanSummary.scan_duration_ms / 1000).toFixed(2)}s</div>
        </div>
      </div>
    </div>

    <!-- Category Storage Breakdown -->
    <div class="card">
      <h2>Storage Category Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>File Count</th>
            <th>Total Size</th>
            <th style="width: 200px;">Distribution</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          ${categoriesRows}
        </tbody>
      </table>
    </div>

    <!-- Top Storage Hogs -->
    <div class="card">
      <h2>Top 20 Largest Files</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">Rank</th>
            <th>File Name</th>
            <th>Category</th>
            <th style="text-align: right;">Size</th>
            <th>Full Path</th>
          </tr>
        </thead>
        <tbody>
          ${largestFilesRows}
        </tbody>
      </table>
    </div>

    <!-- Largest Folders -->
    ${
      largestFoldersRows
        ? `
    <div class="card">
      <h2>Top Heavyweight Folders</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">Rank</th>
            <th>Folder Name</th>
            <th>Files</th>
            <th style="text-align: right;">Size</th>
            <th>Full Path</th>
          </tr>
        </thead>
        <tbody>
          ${largestFoldersRows}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
      Generated by <strong>ByteMap</strong> — Privacy-First Desktop Storage Scout • Open Source
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = scanSummary.root_path.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  a.href = url;
  a.download = `bytemap-storage-audit-${safeName}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
