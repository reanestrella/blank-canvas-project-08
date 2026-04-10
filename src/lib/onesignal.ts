import OneSignal from 'react-onesignal';

export const initOneSignal = async () => {
  await OneSignal.init({
    appId: "60dec75a-357c-4b1e-90fd-f3a0273c4076",
    allowLocalhostAsSecureOrigin: true,
  });
};

export const pedirPermissao = async () => {
  try {
    await OneSignal.Slidedown.promptPush();
  } catch (e) {
    console.log("OneSignal prompt error:", e);
  }
};
