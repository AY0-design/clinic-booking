import type { Metadata } from "next";
import { Inter, Lobster } from "next/font/google";
import { ThemeProvider, themeInitScript } from "spiral-ui";
import "spiral-ui/styles.css";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const lobster = Lobster({ variable: "--font-lobster", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Mayday · Book an appointment",
  description: "Pick a time, tell us who you are, and you're booked in.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lobster.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider defaultBrand="blue">{children}</ThemeProvider>
      </body>
    </html>
  );
}
