import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Open Frontier — Intelligence for everyone",
    template: "%s · Open Frontier",
  },
  description:
    "A calm, transparent AI chat preview from Nanoware AI. This frontend is a local UI prototype with mock data.",
  applicationName: "Open Frontier",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
