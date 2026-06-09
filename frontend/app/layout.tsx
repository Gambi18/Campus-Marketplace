import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "./context/NotificationContext";

export const metadata: Metadata = {
    title: "Campus Marketplace",
    description: "A marketplace for campus students",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <NotificationProvider>
                    {children}
                </NotificationProvider>
            </body>
        </html>
    );
}
