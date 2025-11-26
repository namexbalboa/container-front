import { ThemeProvider } from "next-themes";
import { AlertProvider } from "@/contexts/AlertContext";
import DashboardLayoutClient from "./dashboard-layout-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AlertProvider>
        <DashboardLayoutClient>{children}</DashboardLayoutClient>
      </AlertProvider>
    </ThemeProvider>
  );
}