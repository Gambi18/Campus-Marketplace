import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "./context/NotificationContext";
import AuthGuard from "./components/AuthGuard";
import { Inter, Bricolage_Grotesque } from "next/font/google";

export const metadata: Metadata = {
    title: "Campus Marketplace",
    description: "A marketplace for campus students",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Characterful display face for headings and the wordmark.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${display.variable}`}>
            <body>
                <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-md focus:outline-none">
                    Skip to main content
                </a>
                <NotificationProvider>
                    <AuthGuard>
                        <div id="main-content">{children}</div>
                    </AuthGuard>
                </NotificationProvider>
            </body>
        </html>
    );
}
