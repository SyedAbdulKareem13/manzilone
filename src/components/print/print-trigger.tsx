"use client";

import * as React from "react";

/**
 * Fires the browser print dialog once on mount. Drop this into a print-optimized
 * route so opening it (e.g. in a new tab) immediately offers a "Save as PDF".
 */
export function PrintTrigger() {
  React.useEffect(() => {
    // Defer to the next frame so fonts/layout settle before the dialog opens.
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

/**
 * A plain button that triggers window.print(). Styling is provided by the
 * caller via className so it can match the surrounding print toolbar.
 */
export function PrintButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  );
}
