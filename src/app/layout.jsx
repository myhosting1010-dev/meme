import "./globals.css";
import { AppShell } from "@/components/layouts/app-shell";
import { site } from "@/constants/site";

export const metadata = { title: site.name, description: site.description };

export default function RootLayout({ children }) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
