import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "./context/NotificationContext";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

export const metadata: Metadata = {
    title: "Campus Marketplace",
    description: "A marketplace for campus students",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});


const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
            <body>
                <NotificationProvider>
                    {children}
                </NotificationProvider>
            </body>
        </html>
    );
}
