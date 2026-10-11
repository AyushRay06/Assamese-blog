"use client";

import * as React from "react";

/**
 * Invisible tracker component that increments visitor count by 1
 * on every visit by any viewer or returning visitor.
 */
export function VisitorTracker() {
  const hasTriggeredRef = React.useRef(false);

  React.useEffect(() => {
    // Avoid counting admin panel visits as public visitor views
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      return;
    }

    // Guard against React StrictMode immediate double-invocation in dev
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    fetch("/api/visitor-count", { method: "POST" }).catch(() => {
      // Non-blocking
    });
  }, []);

  return null;
}

export default VisitorTracker;
