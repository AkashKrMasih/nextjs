import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {SiteHeader} from "./components/SiteHeader";
import {SiteFooter} from "./components/SiteFooter";
import {ConditionalSiteHeader} from "./components/ConditionalSiteHeader";
import {ConditionalSiteFooter} from "./components/ConditionalSiteFooter";
import {ConditionalBody} from "./components/ConditionalBody";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets:  ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets:  ["latin"],
});

export const metadata: Metadata = {
  title:       "Shop",
  description: "A basic Next.js storefront",
};

export default function RootLayout({children}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
    <ConditionalBody>
      <ConditionalSiteHeader siteHeader={<SiteHeader/>}/>
      <main className="flex-1">{children}</main>
      <ConditionalSiteFooter siteFooter={<SiteFooter/>}/>
    </ConditionalBody>
    </html>
  );
}