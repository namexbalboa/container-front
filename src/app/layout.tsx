import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthProvider from "@/components/providers/session-provider";
import { SessionSyncProvider } from "@/components/providers/session-sync-provider";
import { AlertProvider } from "@/contexts/AlertContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { GlobalLoadingWrapper } from "@/components/shared/GlobalLoadingWrapper";
import { RouteLoadingMonitor } from "@/components/shared/RouteLoadingMonitor";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cargo Insurance",
  description: "Sistema de gerenciamento de seguros de carga",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider session={session}>
            <SessionSyncProvider>
              <AlertProvider>
                <LoadingProvider>
                  <GlobalLoadingWrapper />
                  <RouteLoadingMonitor />
                  <div className="min-h-screen">
                    {children}
                  </div>
                </LoadingProvider>
              </AlertProvider>
            </SessionSyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
