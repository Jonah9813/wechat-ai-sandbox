import { Capacitor } from '@capacitor/core'

/** 是否运行在 Capacitor 原生壳里（手机 App）。 */
export function isNative() {
  return Capacitor.isNativePlatform()
}

export function platformName() {
  return Capacitor.getPlatform()
}

/** 手机 App 的机型名，用于设置页展示。 */
export function deviceLabel() {
  if (!isNative()) return '浏览器'
  return Capacitor.getPlatform() === 'android' ? 'Android' : Capacitor.getPlatform()
}
