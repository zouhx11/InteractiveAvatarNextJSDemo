export class AudioInputDeviceManager {
  private audioInputDevices: MediaDeviceInfo[] = [];

  constructor() {
    this.initDeviceList();
  }

  public getDeviceId(
    deviceId: string | undefined,
    resolveDefault?: boolean
  ): string | undefined {
    if (!deviceId) {
      return undefined;
    }

    if (deviceId !== 'default') {
      return deviceId;
    }

    return resolveDefault
      ? this.resolveDefaultDevice(this.audioInputDevices)?.deviceId
      : 'default';
  }

  public resolveDefaultDevice(
    audioDevices?: MediaDeviceInfo[]
  ): MediaDeviceInfo | undefined {
    if (!audioDevices?.length) {
      return undefined;
    }

    const defaultDevice = audioDevices.find((device) => device.deviceId === 'default');
    if (!defaultDevice) {
      return undefined;
    }

    const devicesByGroup = audioDevices.filter(
      (device) => device.groupId === defaultDevice.groupId
    );

    if (devicesByGroup.length === 1) {
      return devicesByGroup[0];
    }

    if (!devicesByGroup.length) {
      return undefined;
    }

    const devicesByLabel = devicesByGroup.filter((device) =>
      defaultDevice.label.includes(device.label)
    );
    if (devicesByLabel.length === 1) {
      return devicesByLabel[0];
    }

    return undefined;
  }

  public async handleDeviceChange(
    currentDeviceId: string | undefined
  ): Promise<{ shouldUpdate: boolean; newDevice: MediaDeviceInfo | undefined }> {
    const previousAudioInputDevices = [...this.audioInputDevices];
    this.audioInputDevices = await this.listAudioInputDevices();

    if (!this.audioInputDevices.length) {
      throw new Error('No audio devices found');
    }

    // If the current device is not in the new list, always update to the default or first device.
    if (!this.audioInputDevices.some((device) => device.deviceId === currentDeviceId)) {
      return {
        shouldUpdate: true,
        newDevice:
          this.getDefaultDevice(this.audioInputDevices) || this.audioInputDevices[0],
      };
    }

    const isCurrentDefault = currentDeviceId === 'default';

    // if the current device is not the default, then no need for update
    if (!isCurrentDefault) {
      return {
        shouldUpdate: false,
        newDevice: this.audioInputDevices.find(
          (device) => device.deviceId === currentDeviceId
        )!,
      };
    }

    const newDefault = this.getDefaultDevice(this.audioInputDevices);
    const oldDefault = this.getDefaultDevice(previousAudioInputDevices);
    const isEqualDefaults =
      newDefault && oldDefault
        ? this.isEqualDefaultDevices(newDefault, oldDefault)
        : false;
    // if the default device is the same, then no need for update
    if (isEqualDefaults) {
      return {
        shouldUpdate: false,
        newDevice: newDefault,
      };
    } else {
      return {
        shouldUpdate: true,
        newDevice: newDefault || this.audioInputDevices[0],
      };
    }
  }

  private async listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'audioinput');
  }

  private getDefaultDevice(audioDevices: MediaDeviceInfo[]): MediaDeviceInfo | undefined {
    return audioDevices.find((device) => device.deviceId === 'default');
  }

  private isEqualDefaultDevices(
    oldDevice: MediaDeviceInfo,
    newDevice: MediaDeviceInfo
  ): boolean {
    return oldDevice.label === newDevice.label && oldDevice.groupId === newDevice.groupId;
  }

  private async initDeviceList() {
    this.audioInputDevices = await this.listAudioInputDevices();
  }
}
