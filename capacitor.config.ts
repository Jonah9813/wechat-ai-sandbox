import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.lucky.wechatsandbox',
  appName: '微信',
  webDir: 'dist',
  backgroundColor: '#111111',
  android: {
    backgroundColor: '#111111',
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // 原生 HTTP：手机直连 DeepSeek / Gemini / GitHub API，不受浏览器跨域限制
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
