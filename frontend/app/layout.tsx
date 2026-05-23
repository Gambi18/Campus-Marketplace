import type { Metadata } from "next";
import "./globals.css";

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
            <body>{children}</body>
        </html>
    );
}
