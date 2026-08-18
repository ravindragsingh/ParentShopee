// Native-app-only chrome (status bar + splash screen). Every call is a no-op
// on the web build -- Capacitor.isNativePlatform() is false there, and the
// plugins themselves aren't bundled into behavior that affects the browser.

import { Capacitor } from '@capacitor/core'

const BRAND_TEAL = '#0D9488'
const CREAM = '#FFF9EC'

export async function hideSplashScreen() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    // Splash screen plugin unavailable or already hidden -- nothing to do.
  }
}

// Pages with a light/cream background (login, blog, privacy) want dark
// status bar icons; pages with a colored gradient navbar (dashboards) want
// light icons. Android also gets a matching status bar background color --
// iOS doesn't support that, so its "branding" comes from the navbar's own
// background extending under the notch via safe-area padding instead.
export async function setStatusBarForLightBg() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: CREAM })
    }
  } catch {
    // Status bar plugin unavailable -- nothing to do.
  }
}

export async function setStatusBarForBrandBg() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Light })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: BRAND_TEAL })
    }
  } catch {
    // Status bar plugin unavailable -- nothing to do.
  }
}
