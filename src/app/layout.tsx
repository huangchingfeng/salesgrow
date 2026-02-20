import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SalesGrow - Your AI Sales Coach",
    template: "%s | SalesGrow",
  },
  description:
    "The Duolingo for salespeople. AI-powered coaching, prospecting, and client management. Free forever.",
  keywords: [
    "AI sales coach",
    "sales training",
    "CRM",
    "cold email",
    "sales gamification",
  ],
  openGraph: {
    title: "SalesGrow - Your AI Sales Coach",
    description:
      "The Duolingo for salespeople. AI-powered coaching, prospecting, and client management.",
    type: "website",
    siteName: "SalesGrow",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalesGrow - Your AI Sales Coach",
    description:
      "The Duolingo for salespeople. AI-powered coaching, prospecting, and client management.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
