import OneSignal from 'react-onesignal';

export async function initOneSignal() {
  await OneSignal.init({
    appId: "fbb0594c-d29a-4f6a-af12-cb279e18969e",
    allowLocalhostAsSecureOrigin: true,
  });
}
