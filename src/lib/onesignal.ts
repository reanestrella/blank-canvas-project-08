import OneSignal from "react-onesignal";

export type NotificationPermissionStatus =
  | "default"
  | "denied"
  | "granted"
  | "unsupported"
  | "unavailable"
  | "error";

const ONESIGNAL_APP_ID = "60dec75a-357c-4b1e-90fd-f3a0273c4076";

let oneSignalInitPromise: Promise<void> | null = null;
let oneSignalReady = false;

export const initOneSignal = async () => {
  if (typeof window === "undefined") return;

  if (oneSignalReady) return;

  if (oneSignalInitPromise) {
    return oneSignalInitPromise;
  }

  oneSignalInitPromise = OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    allowLocalhostAsSecureOrigin: true,
  })
    .then(() => {
      oneSignalReady = true;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("already initialized")) {
        oneSignalReady = true;
        return;
      }

      oneSignalInitPromise = null;
      throw error;
    });

  return oneSignalInitPromise;
};

export async function pedirPermissao(): Promise<NotificationPermissionStatus> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    console.log("Notificações não são suportadas neste navegador");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    console.log("Permissão de notificações bloqueada no navegador");
    return "denied";
  }

  try {
    await initOneSignal();

    if (!("OneSignal" in window)) {
      console.log("OneSignal não carregado");
      return "unavailable";
    }

    const oneSignal = (window as any).OneSignal;

    if (typeof oneSignal?.showSlidedownPrompt === "function") {
      await oneSignal.showSlidedownPrompt();
    } else if (typeof oneSignal?.Slidedown?.promptPush === "function") {
      await oneSignal.Slidedown.promptPush();
    } else {
      await OneSignal.Notifications.requestPermission();
    }

    return Notification.permission;
  } catch (e) {
    console.error("Erro ao pedir permissão:", e);
    return "error";
  }
}
