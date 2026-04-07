import OneSignal from "react-onesignal";

export async function initOneSignal() {
  await OneSignal.init({
    appId: "fbb0594c-d29a-4f6a-af12-cb279e18969e",

    allowLocalhostAsSecureOrigin: true,

    serviceWorkerPath: "/OneSignalSDKWorker.js",
    serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",

    notifyButton: {
      enable: true,
      prenotify: true,
      showCredit: false,
      text: {
        "tip.state.unsubscribed": "Inscreva-se para notificações",
        "tip.state.subscribed": "Você está inscrito",
        "tip.state.blocked": "Você bloqueou as notificações",
        "message.prenotify": "Clique para se inscrever",
        "message.action.subscribed": "Obrigado por se inscrever!",
        "message.action.resubscribed": "Você está inscrito para notificações",
        "message.action.unsubscribed": "Você não receberá mais notificações",
        "dialog.main.title": "Gerenciar notificações",
        "dialog.main.button.subscribe": "INSCREVER",
        "dialog.main.button.unsubscribe": "CANCELAR INSCRIÇÃO",
        "dialog.blocked.title": "Desbloquear notificações",
        "dialog.blocked.message": "Siga estas instruções para permitir notificações:",
      },
    },
  });
}

export async function pedirPermissao() {
  const permission = await OneSignal.Notifications.requestPermission();
  console.log("Permissão:", permission);
}
