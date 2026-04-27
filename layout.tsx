import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office status",
  description: "Who's at the office right now?",
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
