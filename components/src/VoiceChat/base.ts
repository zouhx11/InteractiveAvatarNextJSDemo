import { resolveDeviceId } from '../utils';
import { AudioInputDeviceManager } from './AudioInputDeviceManager';

export enum VoiceChatState {
  INACTIVE = 'inactive',
  STARTING = 'starting',
  ACTIVE = 'started',
  STOPPING = 'stopping',
}

export interface VoiceChatConfig {
  config?: { defaultMuted?: boolean; deviceId?: ConstrainDOMString };
}

export interface VoiceChatConstructorConfig {
  onVoiceChatDeviceChanged: (deviceId: string | undefined) => void;
}

export abstract class AbstractVoiceChat<T extends VoiceChatConfig = VoiceChatConfig> {
  abstract get isMuted(): boolean;
  abstract get isVoiceChatting(): boolean;
  abstract getDeviceId(resolveDefault?: boolean): Promise<string | undefined>;
  abstract startVoiceChat(config: T): Promise<void>;
  abstract stopVoiceChat(): Promise<void>;
  abstract mute(): void;
  abstract unmute(): void;
  abstract setDeviceId(deviceId: ConstrainDOMString): Promise<boolean>;
}

export abstract class AbstractVoiceChatImplementation<
  T extends VoiceChatConfig = VoiceChatConfig,
> extends AbstractVoiceChat<T> {
  private audioInputDeviceManager: AudioInputDeviceManager | null = null;
  private _isMuted: boolean = true;
  protected state: VoiceChatState = VoiceChatState.INACTIVE;
  protected onVoiceChatDeviceChanged: (deviceId: string | undefined) => void;

  constructor(config: VoiceChatConstructorConfig) {
    super();
    this.onVoiceChatDeviceChanged = config.onVoiceChatDeviceChanged;
  }

  public get isMuted(): boolean {
    return this._isMuted;
  }

  public get isVoiceChatting(): boolean {
    return this.state !== VoiceChatState.INACTIVE;
  }

  protected abstract _startVoiceChat(voiceChatConfig: T): Promise<void>;
  protected abstract _stopVoiceChat(): Promise<void>;

  public async startVoiceChat(voiceChatConfig: T) {
    if (this.state !== VoiceChatState.INACTIVE) {
      await this.stopVoiceChat();
    }
    try {
      this.state = VoiceChatState.STARTING;
      await this._startVoiceChat(voiceChatConfig);
      this.audioInputDeviceManager = new AudioInputDeviceManager();
      document.addEventListener('devicechange', this.handleDeviceChange);
      this.state = VoiceChatState.ACTIVE;
    } catch (e) {
      await this.stopVoiceChat();
      throw e;
    }
  }

  public async stopVoiceChat() {
    if (this.state === VoiceChatState.INACTIVE) {
      return;
    }
    this.state = VoiceChatState.STOPPING;
    await this._stopVoiceChat();
    this._isMuted = true;
    document.removeEventListener('devicechange', this.handleDeviceChange);
    this.state = VoiceChatState.INACTIVE;
  }

  protected _mute(): void {
    return;
  }

  protected _unmute(): void {
    return;
  }

  public mute() {
    if (!this.isVoiceChatting) {
      return;
    }
    this._mute();
    this._isMuted = true;
  }

  public unmute() {
    if (!this.isVoiceChatting) {
      return;
    }
    this._unmute();
    this._isMuted = false;
  }

  protected abstract _setDeviceId(deviceId: ConstrainDOMString): Promise<void>;
  protected abstract _getDeviceId(): Promise<string | undefined>;

  public async setDeviceId(deviceId: ConstrainDOMString): Promise<boolean> {
    if (this.state === VoiceChatState.ACTIVE) {
      const previousDeviceId = await this.getDeviceId();
      const resolvedDeviceId = resolveDeviceId(deviceId);
      if (previousDeviceId === resolvedDeviceId) {
        return true;
      }
      await this._setDeviceId(deviceId);
      const newDeviceId = await this.getDeviceId();

      if (previousDeviceId !== newDeviceId) {
        this.onVoiceChatDeviceChanged(newDeviceId);
      }

      return deviceId === newDeviceId;
    } else {
      console.warn('Cannot set device id when voice chat is not active');
      return false;
    }
  }

  public async getDeviceId(resolveDefault?: boolean): Promise<string | undefined> {
    if (this.state === VoiceChatState.ACTIVE && this.audioInputDeviceManager) {
      const deviceId = await this._getDeviceId();
      return this.audioInputDeviceManager.getDeviceId(deviceId, resolveDefault);
    }
    return undefined;
  }

  private handleDeviceChange = async () => {
    if (this.state === VoiceChatState.ACTIVE && this.audioInputDeviceManager) {
      const currentDeviceId = await this.getDeviceId();
      const res = await this.audioInputDeviceManager.handleDeviceChange(currentDeviceId);
      if (res.shouldUpdate && res.newDevice) {
        await this.setDeviceId(res.newDevice.deviceId);
      }
    }
  };
}
