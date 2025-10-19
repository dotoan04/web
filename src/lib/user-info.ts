export type UserInfo = {
  browser: {
    name: string
    version: string
    userAgent: string
  }
  os: {
    name: string
    version: string
  }
  device: {
    type: 'mobile' | 'tablet' | 'desktop'
    vendor?: string
    model?: string
    isTouchDevice: boolean
    pixelRatio: number
  }
  screen: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    colorDepth: number
    orientation: 'portrait' | 'landscape'
  }
  viewport: {
    width: number
    height: number
  }
  environment: {
    language: string
    languages: string[]
    timezone: string
    timezoneOffset: number
  }
  network?: {
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }
  performance?: {
    deviceMemory?: number
    hardwareConcurrency?: number
  }
}

const detectBrowser = (userAgent: string): { name: string; version: string } => {
  const ua = userAgent.toLowerCase()
  
  // Edge
  if (ua.includes('edg/')) {
    const match = ua.match(/edg\/(\d+\.\d+)/)
    return { name: 'Edge', version: match?.[1] || 'unknown' }
  }
  
  // Chrome
  if (ua.includes('chrome/') && !ua.includes('edg/')) {
    const match = ua.match(/chrome\/(\d+\.\d+)/)
    return { name: 'Chrome', version: match?.[1] || 'unknown' }
  }
  
  // Safari
  if (ua.includes('safari/') && !ua.includes('chrome/')) {
    const match = ua.match(/version\/(\d+\.\d+)/)
    return { name: 'Safari', version: match?.[1] || 'unknown' }
  }
  
  // Firefox
  if (ua.includes('firefox/')) {
    const match = ua.match(/firefox\/(\d+\.\d+)/)
    return { name: 'Firefox', version: match?.[1] || 'unknown' }
  }
  
  // Opera
  if (ua.includes('opr/') || ua.includes('opera/')) {
    const match = ua.match(/(?:opr|opera)\/(\d+\.\d+)/)
    return { name: 'Opera', version: match?.[1] || 'unknown' }
  }
  
  return { name: 'Unknown', version: 'unknown' }
}

const detectOS = (userAgent: string): { name: string; version: string } => {
  const ua = userAgent.toLowerCase()
  
  // Windows
  if (ua.includes('windows nt')) {
    const match = ua.match(/windows nt (\d+\.\d+)/)
    const version = match?.[1] || 'unknown'
    const windowsVersionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    }
    return { name: 'Windows', version: windowsVersionMap[version] || version }
  }
  
  // macOS
  if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x (\d+[._]\d+)/)
    return { name: 'macOS', version: match?.[1]?.replace('_', '.') || 'unknown' }
  }
  
  // iOS
  if (ua.includes('iphone') || ua.includes('ipad')) {
    const match = ua.match(/os (\d+[._]\d+)/)
    return { name: 'iOS', version: match?.[1]?.replace('_', '.') || 'unknown' }
  }
  
  // Android
  if (ua.includes('android')) {
    const match = ua.match(/android (\d+\.\d+)/)
    return { name: 'Android', version: match?.[1] || 'unknown' }
  }
  
  // Linux
  if (ua.includes('linux')) {
    return { name: 'Linux', version: 'unknown' }
  }
  
  return { name: 'Unknown', version: 'unknown' }
}

const detectDeviceType = (userAgent: string): 'mobile' | 'tablet' | 'desktop' => {
  const ua = userAgent.toLowerCase()
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet'
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile'
  }
  
  return 'desktop'
}

export const collectUserInfo = (): UserInfo => {
  const userAgent = navigator.userAgent
  const browser = detectBrowser(userAgent)
  const os = detectOS(userAgent)
  const deviceType = detectDeviceType(userAgent)
  
  const info: UserInfo = {
    browser: {
      name: browser.name,
      version: browser.version,
      userAgent,
    },
    os: {
      name: os.name,
      version: os.version,
    },
    device: {
      type: deviceType,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1,
    },
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      orientation: screen.width > screen.height ? 'landscape' : 'portrait',
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    environment: {
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
    },
  }
  
  // Optional: Network Information API (Chrome/Edge only)
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    info.network = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    }
  }
  
  // Optional: Device Memory API (Chrome/Edge only)
  if ('deviceMemory' in navigator) {
    info.performance = info.performance || {}
    info.performance.deviceMemory = (navigator as any).deviceMemory
  }
  
  // Optional: Hardware Concurrency
  if ('hardwareConcurrency' in navigator) {
    info.performance = info.performance || {}
    info.performance.hardwareConcurrency = navigator.hardwareConcurrency
  }
  
  return info
}

export const formatUserInfoForDisplay = (userInfo: UserInfo): string[] => {
  const lines: string[] = []
  
  lines.push(`🌐 Browser: ${userInfo.browser.name} ${userInfo.browser.version}`)
  lines.push(`💻 OS: ${userInfo.os.name} ${userInfo.os.version}`)
  lines.push(`📱 Device: ${userInfo.device.type} (${userInfo.device.isTouchDevice ? 'Touch' : 'No Touch'})`)
  lines.push(`🖥️ Screen: ${userInfo.screen.width}x${userInfo.screen.height} (${userInfo.screen.orientation})`)
  lines.push(`📐 Viewport: ${userInfo.viewport.width}x${userInfo.viewport.height}`)
  lines.push(`🎨 Pixel Ratio: ${userInfo.device.pixelRatio}x`)
  lines.push(`🌍 Language: ${userInfo.environment.language}`)
  lines.push(`⏰ Timezone: ${userInfo.environment.timezone}`)
  
  if (userInfo.network) {
    lines.push(`📶 Network: ${userInfo.network.effectiveType || 'unknown'}`)
  }
  
  if (userInfo.performance?.deviceMemory) {
    lines.push(`💾 Memory: ${userInfo.performance.deviceMemory}GB`)
  }
  
  if (userInfo.performance?.hardwareConcurrency) {
    lines.push(`⚙️ CPU Cores: ${userInfo.performance.hardwareConcurrency}`)
  }
  
  return lines
}
