/**
 * Device detection utilities for Lumbus
 * Detects iOS version, platform, and eSIM capability
 */

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  iosVersion: number | null;
  supportsUniversalLink: boolean; // iOS 17.4+
  supportsEsim: boolean;
}

/**
 * Parse iOS version from user agent
 * Examples: "iPhone OS 17_4_1" -> 17.4, "iPhone OS 16_5" -> 16.5
 */
function parseIOSVersion(userAgent: string): number | null {
  const match = userAgent.match(/OS (\d+)_(\d+)(?:_\d+)?/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return major + minor / 10;
  }
  return null;
}

/**
 * Detect device information from user agent (server or client side)
 */
export function detectDevice(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Platform detection
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isWindows = /windows/.test(ua);
  const isMacOS = /macintosh|mac os x/.test(ua) && !/iphone|ipad|ipod/.test(ua);
  const isLinux = /linux/.test(ua) && !isAndroid;

  // Mobile detection
  const isMobile = isIOS || isAndroid || /mobile/.test(ua);

  // iOS version
  const iosVersion = isIOS ? parseIOSVersion(userAgent) : null;

  // iOS 17.4+ supports Universal Link for eSIM installer
  const supportsUniversalLink = isIOS && iosVersion !== null && iosVersion >= 17.4;

  // Basic eSIM support detection
  // iOS 12.1+, Android 9+, Windows 11 24H2+
  let supportsEsim = false;
  if (isIOS && iosVersion !== null && iosVersion >= 12.1) {
    supportsEsim = true;
  } else if (isAndroid) {
    // Android version detection is unreliable, assume most modern Android devices support eSIM
    const androidMatch = ua.match(/android (\d+)/);
    if (androidMatch) {
      const androidVersion = parseInt(androidMatch[1], 10);
      supportsEsim = androidVersion >= 9;
    } else {
      supportsEsim = true; // Assume modern
    }
  }

  // Determine platform
  let platform: DeviceInfo['platform'] = 'unknown';
  if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';
  else if (isWindows) platform = 'windows';
  else if (isMacOS) platform = 'macos';
  else if (isLinux) platform = 'linux';

  return {
    platform,
    isIOS,
    isAndroid,
    isMobile,
    iosVersion,
    supportsUniversalLink,
    supportsEsim,
  };
}

/**
 * Client-side device detection hook (for use in components)
 */
export function useDeviceDetection(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'unknown',
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      iosVersion: null,
      supportsUniversalLink: false,
      supportsEsim: false,
    };
  }
  return detectDevice(navigator.userAgent);
}

/**
 * Build iOS Universal Link for eSIM activation
 * https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$<SM-DP+>$<ActivationCode>
 */
export function buildIOSUniversalLink(smdp: string, activationCode: string): string {
  const lpaString = `LPA:1$${smdp}$${activationCode}`;
  return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`;
}

/**
 * Build LPA string for manual entry
 * Format: LPA:1$<SM-DP+>$<ActivationCode>
 */
export function buildLPAString(smdp: string, activationCode: string): string {
  return `LPA:1$${smdp}$${activationCode}`;
}

/**
 * Trigger haptic feedback on mobile devices
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
  };

  navigator.vibrate(patterns[type]);
}
