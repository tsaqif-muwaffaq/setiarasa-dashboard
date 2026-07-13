// src/utils/midtrans.ts

export const loadMidtransSnap = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Cek apakah sudah ada
    if (document.getElementById('midtrans-snap-script')) {
      // @ts-ignore
      if (window.snap) {
        resolve();
        return;
      }
      // Jika script sudah ada tapi belum load
      const existingScript = document.getElementById('midtrans-snap-script');
      if (existingScript) {
        existingScript.remove();
      }
    }

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    const snapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';

    if (!clientKey) {
      console.warn('⚠️ VITE_MIDTRANS_CLIENT_KEY not set, using fallback');
    }

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey || '');
    script.async = true;

    let resolved = false;

    script.onload = () => {
      // @ts-ignore
      if (window.snap) {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      } else {
        // Jika snap belum tersedia, tunggu sebentar
        let attempts = 0;
        const checkSnap = setInterval(() => {
          attempts++;
          // @ts-ignore
          if (window.snap) {
            clearInterval(checkSnap);
            if (!resolved) {
              resolved = true;
              resolve();
            }
          } else if (attempts > 10) {
            clearInterval(checkSnap);
            if (!resolved) {
              resolved = true;
              reject(new Error('Midtrans Snap failed to initialize'));
            }
          }
        }, 200);
      }
    };

    script.onerror = () => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Failed to load Midtrans Snap script'));
      }
    };

    document.head.appendChild(script);

    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // @ts-ignore
        if (window.snap) {
          resolve();
        } else {
          reject(new Error('Midtrans Snap load timeout'));
        }
      }
    }, 15000);
  });
};