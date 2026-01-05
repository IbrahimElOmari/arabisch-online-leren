import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Synchronously compute initial mobile state to prevent layout flash
 * This fixes RTL mobile layout issues where initial desktop render causes main content shift
 * CRITICAL: This function runs BEFORE React hydrates, ensuring correct initial state
 */
function getInitialMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_BREAKPOINT
}

/**
 * Hook that returns whether the viewport is mobile-sized
 * CRITICAL: Return type is always boolean, never undefined
 * This prevents hydration race conditions in sidebar/RTL layouts
 */
export function useIsMobile(): boolean {
  // CRITICAL: Use synchronous initial value - never undefined
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener("change", onChange)
    // Sync state immediately on mount
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
