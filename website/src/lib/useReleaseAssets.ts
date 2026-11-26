import { useState, useEffect } from 'react';

interface ReleaseAssetsState {
  downloadCount: number;
  exeUrl: string;
  dmgUrl: string;
  msiUrl: string;
}

const DEFAULT_ASSETS: ReleaseAssetsState = {
  downloadCount: 57,
  exeUrl:
    'https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.14/ByteMap_1.0.14_x64-setup.exe',
  dmgUrl:
    'https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.14/ByteMap_1.0.14_universal.dmg',
  msiUrl:
    'https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.14/ByteMap_1.0.14_x64_en-US.msi',
};

/**
 * Fetches latest GitHub Release download links and total community download counts
 * across releases, falling back gracefully to the current pinned v1.0.14 assets.
 */
export function useReleaseAssets(): ReleaseAssetsState {
  const [assets, setAssets] = useState<ReleaseAssetsState>(DEFAULT_ASSETS);

  useEffect(() => {
    let cancelled = false;

    fetch('https://api.github.com/repos/ankitpandey1900/ByteMap/releases')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;

        let total = 0;
        let exeUrl = '';
        let dmgUrl = '';
        let msiUrl = '';

        for (const rel of data) {
          if (!Array.isArray(rel.assets)) continue;
          for (const asset of rel.assets) {
            total += asset.download_count || 0;
            const name: string = asset.name || '';
            const url: string = asset.browser_download_url || '';
            if (!url) continue;
            if (!dmgUrl && name.endsWith('.dmg')) dmgUrl = url;
            if (!exeUrl && name.endsWith('.exe')) exeUrl = url;
            if (!msiUrl && name.endsWith('.msi')) msiUrl = url;
          }
        }

        setAssets((prev) => ({
          downloadCount: total > 0 ? total : prev.downloadCount,
          exeUrl: exeUrl || prev.exeUrl,
          dmgUrl: dmgUrl || prev.dmgUrl,
          msiUrl: msiUrl || prev.msiUrl,
        }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return assets;
}
