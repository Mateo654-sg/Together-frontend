/**
 * @module shared/platform
 * @description Detección de plataforma (iOS / Android / otros) centralizada,
 * usada por la navegación y otras UI adaptativas.
 */

export type PlatformName = 'ios' | 'android' | 'other';

/**
 * Detección de plataforma vía user-agent.
 * Se puede sobreescribir en tests con `setPlatformForTest`.
 */
export function detectPlatform(): PlatformName {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const uaLower = ua.toLowerCase();

  if (/iphone|ipad|ipod/.test(uaLower)) return 'ios';
  // iPad reciente se reporta como Mac y desktop; es una plataforma iOS
  if (/macintosh/.test(uaLower) && navigator.maxTouchPoints > 1) return 'ios';
  if (/android/.test(uaLower)) return 'android';

  return 'other';
}

let _override: PlatformName | null = null;

/** Solo para tests: fuerza una plataforma concreta. */
export function setPlatformForTest(platform: PlatformName | null): void {
  _override = platform;
}

export const platform: PlatformName = _override ?? detectPlatform();
export const isIOS: boolean = platform === 'ios';
export const isAndroid: boolean = platform === 'android';
