import { useEffect, useRef, useState } from 'react'

const DISMISS_KEY = 'appBannerDismissedUntil'
const DISMISS_DAYS = 14
const HEIGHT_VAR = '--app-banner-height'

// Store URLs aren't set anywhere yet -- both env vars are undefined until
// the app is actually published, so this renders nothing in the meantime.
// Once live, set VITE_ANDROID_APP_URL / VITE_IOS_APP_URL in Vercel's
// environment variables (same place VITE_API_URL already lives).
const STORE_URLS = {
  android: import.meta.env.VITE_ANDROID_APP_URL,
  ios: import.meta.env.VITE_IOS_APP_URL,
}

const ICONS = {
  android: '/branding/RewardURKids_Android_App_Icon.png',
  ios: '/branding/RewardURKids_iOS_App_Icon.png',
}

function detectMobileOS() {
  const ua = navigator.userAgent || navigator.vendor || ''
  if (/android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  return null
}

function isRunningInNativeApp() {
  // The Capacitor runtime injects this global into the native app's WebView
  // -- if this code ever ships inside that app too, it should stay silent.
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
}

export default function AppDownloadBanner() {
  const [dismissed, setDismissed] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    const until = Number(localStorage.getItem(DISMISS_KEY) || 0)
    setDismissed(Date.now() < until)
  }, [])

  const os = !dismissed && !isRunningInNativeApp() ? detectMobileOS() : null
  const storeUrl = os && STORE_URLS[os]
  const visible = !!storeUrl

  // Other fixed-position chrome (e.g. Login's top-right nav buttons) reads
  // this to offset itself below the banner instead of stacking underneath
  // it -- keeps them decoupled rather than passing banner state around.
  useEffect(() => {
    const root = document.documentElement
    if (visible && ref.current) {
      root.style.setProperty(HEIGHT_VAR, `${ref.current.offsetHeight}px`)
    } else {
      root.style.setProperty(HEIGHT_VAR, '0px')
    }
    return () => root.style.setProperty(HEIGHT_VAR, '0px')
  }, [visible])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000))
    setDismissed(true)
  }

  return (
    <div className="app-download-banner" ref={ref}>
      <img src={ICONS[os]} alt="" className="app-download-banner-icon" />
      <div className="app-download-banner-text">
        <strong>Reward Ur Kids</strong>
        <span>Get the app for the best experience</span>
      </div>
      <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="app-download-banner-cta">
        Open
      </a>
      <button type="button" className="app-download-banner-close" onClick={dismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  )
}
