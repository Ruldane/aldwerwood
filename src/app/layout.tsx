import type { Metadata, Viewport } from "next";
import { Cedarville_Cursive, EB_Garamond, IM_Fell_English, Special_Elite } from "next/font/google";
import "./globals.css";

/* Display: the Fell types, cut in the 1670s and still carrying letterpress bite. */
const fell = IM_Fell_English({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fell",
  display: "swap",
});

/* Book text: a readable Garamond with old-style figures. */
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

/* The keepers' hands. */
const hand = Cedarville_Cursive({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cedarville",
  display: "swap",
});

/* Typed archival labels, from the typewriter decades onward. */
const typed = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-elite",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "The Chronicle of Alderwood",
  description:
    "A naturalist's field journal kept by four generations upon one wood, from its first saplings in 1887 to tonight. Scroll, and the years pass.",
  openGraph: {
    title: "The Chronicle of Alderwood",
    description: "Four keepers. One wood. Every year since 1887.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e4dfca",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${fell.variable} ${garamond.variable} ${hand.variable} ${typed.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Arm the scroll choreography before first paint so layers never stack;
            without JavaScript the class is absent and every passage simply shows. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('timeline-live')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
