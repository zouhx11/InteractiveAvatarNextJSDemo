export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function convertFloat32ToS16PCM(float32Array: Float32Array) {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    const clampedValue = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = clampedValue < 0 ? clampedValue * 32768 : clampedValue * 32767;
  }
  return int16Array;
}

export function resolveDeviceId(deviceId: ConstrainDOMString): string {
  if (typeof deviceId === 'string' || typeof deviceId === 'number') {
    return deviceId;
  }

  if (Array.isArray(deviceId)) {
    return deviceId[0];
  }
  if (deviceId.exact) {
    if (Array.isArray(deviceId.exact)) {
      return deviceId.exact[0];
    }
    return deviceId.exact;
  }
  if (deviceId.ideal) {
    if (Array.isArray(deviceId.ideal)) {
      return deviceId.ideal[0];
    }
    return deviceId.ideal;
  }
  throw Error('could not resolve device id');
}
