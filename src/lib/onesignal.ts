import OneSignal from "react-onesignal";

export async function initOneSignal() {
  await OneSignal.init({
    appId: "fbb0594c-d29a-4f6a-af12-cb279e18969e",

    allowLocalhostAsSecureOrigin: true,

    serviceWorkerPath: "/OneSignalSDKWorker.js",
    serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",

    notifyButton: {
      enable: true,
    },
  });
}

export async function pedirPermissao() {
  const permission = await OneSignal.Notifications.requestPermission();
  console.log("Permissão:", permission);
}
