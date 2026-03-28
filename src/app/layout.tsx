import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Strength training workout tracker",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
            if (t === 'light') {
              document.documentElement.style.colorScheme = 'light';
              var v = {'--bg-primary':'#f5f5f5','--bg-secondary':'#e8e8e8','--bg-card':'#ffffff','--text-primary':'#1a1a1a','--text-secondary':'#6b7280','--accent-green':'#16a34a','--accent-blue':'#2563eb','--accent-red':'#dc2626','--accent-yellow':'#ca8a04'};
              for (var k in v) document.documentElement.style.setProperty(k, v[k]);
            }
          })();
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(function() {});
          }
        `}} />
      </head>
      <body className="min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <main className="max-w-lg mx-auto px-4 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fadeIn">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
