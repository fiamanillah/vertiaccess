// Global Leaflet CSS loader - only loads once
let cssLoaded = false;
let cssLoading = false;
const loadCallbacks: (() => void)[] = [];

export function loadLeafletCSS(): Promise<void> {
  if (cssLoaded) {
    return Promise.resolve();
  }

  if (cssLoading) {
    return new Promise((resolve) => {
      loadCallbacks.push(resolve);
    });
  }

  cssLoading = true;

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    
    link.onload = () => {
      cssLoaded = true;
      cssLoading = false;
      resolve();
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };
    
    document.head.appendChild(link);
  });
}
