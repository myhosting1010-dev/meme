"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function ErrorBoundary({ reset }) {
  return <ErrorPanel onRetry={reset} />;
}
