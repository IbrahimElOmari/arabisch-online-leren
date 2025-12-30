import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Synchronously compute initial mobile state to prevent layout flash
 * This fixes RTL mobile layout issues where initial desktop render causes main content shift
 */
function getInitialMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_BREAKPOINT
}

export function useIsMobile() {
  // FIX: Use synchronous initial value to prevent desktop-first layout flash
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // Sync state in case of SSR hydration mismatch
    setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
