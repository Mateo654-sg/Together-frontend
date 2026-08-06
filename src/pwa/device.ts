/**
 * @module pwa/device
 * @description Utilidades de funciones de dispositivo móvil:
 * geolocalización, cámara, notificaciones locales, vibración y compartir.
 */

// ── Geolocalización ──────────────────────────────────────────
export async function getCurrentPosition(timeoutMs = 10000): Promise<GeolocationPosition> {
  if (!('geolocation' in navigator)) {
    throw new Error('La geolocalización no está disponible en este dispositivo.');
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 60000,
    });
  });
}

const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(
      `${REVERSE_URL}?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!response.ok) return null;
    const data = (await response.json()) as { display_name?: string };
    const parts = (data.display_name || '').split(',').slice(0, 3);
    return parts.length > 0 ? parts.join(',').trim() : null;
  } catch {
    return null;
  }
}

/** Devuelve una etiqueta amigable (barrio/ciudad) o las coordenadas. */
export async function getFriendlyLocation(): Promise<string> {
  const position = await getCurrentPosition();
  const { latitude, longitude } = position.coords;
  const rounded = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  const label = await reverseGeocode(latitude, longitude);
  return label || rounded;
}

// ── Cámara / galería ─────────────────────────────────────────
export function captureImageFile(capture = true): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    if (capture && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      input.setAttribute('capture', 'environment');
    }
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No se seleccionó ninguna imagen.'));
        return;
      }
      resolve(file);
    };
    input.oncancel = () => reject(new Error('Captura cancelada.'));
    input.click();
  });
}

// ── Notificaciones locales ───────────────────────────────────
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

export function notificationsSupported(): boolean {
  return 'Notification' in window;
}

export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, options);
  } catch {
    /* noop */
  }
}

// ── Vibración ────────────────────────────────────────────────
export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop */
    }
  }
}

// ── Web Share ────────────────────────────────────────────────
export async function shareData(data: ShareData): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function canShare(): boolean {
  return Boolean(navigator.share);
}
