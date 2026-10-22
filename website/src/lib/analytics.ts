// website/src/lib/analytics.ts
// Google Analytics 4 (GA4) integration for ByteMap

// Reads from Vercel / Vite environment variables (GA_MEASUREMENT_ID)
export const GA_MEASUREMENT_ID: string =
  (import.meta as any)?.env?.GA_MEASUREMENT_ID ||
  (import.meta as any)?.env?.VITE_GA_MEASUREMENT_ID ||
  (import.meta as any)?.env?.VITE_GA_ID ||
  (typeof window !== 'undefined' ? (window as any).GA_MEASUREMENT_ID : '') ||
  '';

/**
 * Initialize Google Analytics 4 dynamically
 */
export function initAnalytics() {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }

  // Avoid injecting script multiple times
  if (document.getElementById('ga-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    anonymize_ip: false, // Allows country/city geolocation
  });
}

/**
 * Track file download events with file name, platform, and download URL
 */
export function trackDownloadClick(fileName: string, platform: 'windows_exe' | 'windows_msi' | 'mac_dmg', downloadUrl?: string) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'file_download', {
      file_name: fileName,
      file_extension: fileName.split('.').pop() || '',
      platform: platform,
      link_url: downloadUrl || '',
      transport_type: 'beacon',
    });
  }
}
