import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  metadataBase: new URL("https://toolbox.rigilgilbert.com"),
  title: {
    default: "Developer Toolbox — Every Developer Tool. One Place.",
    template: "%s — Free Developer Toolbox",
  },
  description:
    "37 free, privacy-focused developer utilities. Format JSON, decode JWTs, inspect APIs and generate secure credentials in your browser.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Developer Toolbox",
    description: "Every developer tool. One place.",
    type: "website",
    locale: "en_US",
    siteName: "Developer Toolbox",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
