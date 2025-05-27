import { useEffect, useState } from 'react';

const getAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
  await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'audioinput');
};

export const useAudioInputDevices = () => {
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const res = await getAudioDevices();
        setAudioInputDevices(res);
      } catch (error) {
        console.error(error);
      }
    };

    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, []);

  return {
    audioInputDevices,
  };
};
