"use client";

import "./globals.css";
import { ErrorPanel } from "@/components/ui/error-panel";

export default function GlobalError({ reset }) {
  return <html lang="en"><body><main className="p-6"><ErrorPanel onRetry={reset} /></main></body></html>;
}
