import { useCallback, useEffect } from 'react';
import { StreamingEvents } from '../src';

import { useStreamingAvatarContext } from './context';

export const useVoiceChat = () => {
  const {
    avatarRef,
    isMuted,
    setIsMuted,
    isVoiceChatActive,
    setIsVoiceChatActive,
    isVoiceChatLoading,
    setIsVoiceChatLoading,
    voiceChatDeviceId,
    setVoiceChatDeviceId,
  } = useStreamingAvatarContext();

  const startVoiceChat = useCallback(
    async (isInputAudioMuted?: boolean, deviceId?: string) => {
      if (!avatarRef.current) return;
      setIsVoiceChatLoading(true);

      await avatarRef.current?.startVoiceChat({
        isInputAudioMuted,
        deviceId: deviceId,
      });
      const initialDeviceId = await avatarRef.current.getVoiceChatDeviceId();
      setVoiceChatDeviceId(initialDeviceId);
      avatarRef.current.on(StreamingEvents.VOICE_CHAT_DEVICE_CHANGED, ({ detail }) => {
        setVoiceChatDeviceId(detail.deviceId);
      });
      setIsVoiceChatLoading(false);
      setIsVoiceChatActive(true);
      setIsMuted(!!isInputAudioMuted);
    },
    [
      avatarRef,
      setIsMuted,
      setIsVoiceChatActive,
      setIsVoiceChatLoading,
      setVoiceChatDeviceId,
    ]
  );

  const stopVoiceChat = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current?.closeVoiceChat();
    setIsVoiceChatActive(false);
    setIsMuted(true);
  }, [avatarRef, setIsMuted, setIsVoiceChatActive]);

  const muteInputAudio = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current?.muteInputAudio();
    setIsMuted(true);
  }, [avatarRef, setIsMuted]);

  const unmuteInputAudio = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current?.unmuteInputAudio();
    setIsMuted(false);
  }, [avatarRef, setIsMuted]);

  const setVoiceChatDevice = useCallback(
    async (deviceId: ConstrainDOMString): Promise<boolean> => {
      if (!avatarRef.current) return false;
      return avatarRef.current.setVoiceChatDeviceId(deviceId);
    },
    [avatarRef]
  );

  return {
    startVoiceChat,
    stopVoiceChat,
    muteInputAudio,
    unmuteInputAudio,
    isMuted,
    isVoiceChatActive,
    isVoiceChatLoading,
    voiceChatDeviceId,
    setVoiceChatDeviceId: setVoiceChatDevice,
  };
};
