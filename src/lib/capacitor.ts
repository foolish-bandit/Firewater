/**
 * Capacitor plugin wrappers.
 *
 * These provide graceful fallbacks when running in the browser (PWA mode)
 * vs as a native Capacitor app. Import from here instead of directly
 * from @capacitor/* packages.
 */

import { Capacitor } from "@capacitor/core";

/** Whether we're running as a native app (iOS/Android) vs web */
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'

// ─── Camera ──────────────────────────────────────────────────────────────────

export interface CapturedPhoto {
  /** Data URI or file path */
  dataUrl: string;
  /** MIME type */
  mimeType: string;
  /** File name */
  fileName: string;
}

/**
 * Take a photo using native camera or fall back to file input.
 * Returns null if the user cancels.
 */
export async function takePhoto(): Promise<CapturedPhoto | null> {
  if (isNative) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // let user choose camera vs gallery
        width: 1200,
        height: 1200,
      });

      if (!image.dataUrl) return null;

      const mimeType = image.format === "png" ? "image/png" : "image/jpeg";
      return {
        dataUrl: image.dataUrl,
        mimeType,
        fileName: `photo.${image.format || "jpg"}`,
      };
    } catch {
      return null; // user cancelled or permission denied
    }
  }

  // Web fallback: use file input
  return new Promise<CapturedPhoto | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.capture = "environment";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          mimeType: file.type,
          fileName: file.name,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    // Handle cancel
    input.oncancel = () => resolve(null);

    input.click();
  });
}

/**
 * Convert a data URL to a File object for upload.
 */
export function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): File {
  const arr = dataUrl.split(",");
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new File([u8arr], fileName, { type: mimeType });
}

// ─── Haptics ─────────────────────────────────────────────────────────────────

/**
 * Trigger a light haptic tap (for toggle actions, button presses).
 * No-op on web.
 */
export async function hapticTap(): Promise<void> {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics not available
  }
}

/**
 * Trigger a medium haptic impact (for confirmations, success).
 */
export async function hapticImpact(): Promise<void> {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Haptics not available
  }
}

/**
 * Trigger haptic notification (success/warning/error).
 */
export async function hapticNotification(type: "success" | "warning" | "error"): Promise<void> {
  if (!isNative) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: typeMap[type] });
  } catch {
    // Haptics not available
  }
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

/**
 * Set the native status bar to dark style (light text on dark background).
 * No-op on web.
 */
export async function setStatusBarStyle(): Promise<void> {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // StatusBar plugin not available
  }
}

// ─── Splash Screen ──────────────────────────────────────────────────────────

/**
 * Hide the native splash screen. Call after app is fully rendered.
 * No-op on web.
 */
export async function hideSplashScreen(): Promise<void> {
  if (!isNative) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    // SplashScreen plugin not installed
  }
}

/**
 * Initialize native platform features (status bar + splash screen).
 * Call once after the app mounts. No-op on web.
 */
export async function initNative(): Promise<void> {
  if (!isNative) return;
  await setStatusBarStyle();
  await hideSplashScreen();
}

// ─── Network ─────────────────────────────────────────────────────────────────

/**
 * Enhanced online status that uses Capacitor Network plugin on native,
 * falls back to navigator.onLine on web.
 */
export function onNetworkChange(callback: (isOnline: boolean) => void): () => void {
  if (isNative) {
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    import("@capacitor/network").then(({ Network }) => {
      Network.addListener("networkStatusChange", (status) => {
        callback(status.connected);
      }).then((handle) => {
        listenerHandle = handle;
      });
    });

    return () => {
      listenerHandle?.remove();
    };
  }

  // Web fallback
  const onOnline = () => callback(true);
  const onOffline = () => callback(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
