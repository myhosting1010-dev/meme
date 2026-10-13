import Link from "next/link";
import { StatusPanel } from "@/components/ui/status-panel";

export default function NotFound() {
  return <StatusPanel title="Page not found"><p>This page is unavailable.</p><Link href="/" className="mt-4 inline-block font-semibold text-accent underline">Return home</Link></StatusPanel>;
}
