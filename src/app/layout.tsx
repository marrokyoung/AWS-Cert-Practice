import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Cert Practice",
  description: "Open-source AWS certification study app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
