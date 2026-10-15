import "./globals.css";
import { AppShell } from "@/components/layouts/app-shell";
import { site } from "@/constants/site";
import { AuthProvider } from "@/features/auth/auth-provider";

export const metadata = { title: site.name, description: site.description };

export default function RootLayout({ children }) {
  return <html lang="en"><body><AuthProvider><AppShell>{children}</AppShell></AuthProvider></body></html>;
}
