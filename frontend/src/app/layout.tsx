import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { MetadataProvider } from "@/providers/MetadataProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Eminent TuitionHub",
  description: "Tuition Management Application",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <MetadataProvider>
              {children}
              <Toaster richColors position="top-right" />
            </MetadataProvider>
          </ThemeProvider>
        </PostHogProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
