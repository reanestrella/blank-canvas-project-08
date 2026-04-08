import OneSignal from 'react-onesignal';

export const initOneSignal = async () => {
  await OneSignal.init({
    appId: "fbb0594c-d29a-4f6a-af12-cb279e18969e",

    notifyButton: {
      enable: true,
    },

    allowLocalhostAsSecureOrigin: true,
  });
};

export const pedirPermissao = async () => {
  await OneSignal.showSlidedownPrompt();
};
