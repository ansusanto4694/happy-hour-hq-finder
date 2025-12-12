import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Get initial mobile state synchronously to prevent layout shift
const getInitialMobileState = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  // Initialize with actual value to prevent CLS
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialMobileState)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // Sync state in case SSR value differs
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
