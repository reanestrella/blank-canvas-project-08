import OneSignal from 'react-onesignal';

export const initOneSignal = async () => {
  await OneSignal.init({
    appId: "60dec75a-357c-4b1e-90fd-f3a0273c4076",

    notifyButton: {
      enable: true,
    },

    allowLocalhostAsSecureOrigin: true,
  });
};

export const pedirPermissao = async () => {
  await OneSignal.showSlidedownPrompt();
};
