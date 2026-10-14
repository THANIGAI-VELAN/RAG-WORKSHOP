import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asterion Assist | Company Knowledge",
  description:
    "Get clear, source-grounded answers about Asterion Works policies, products, and support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
