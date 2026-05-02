import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANU Compass — A focused tool for ANU students",
  description:
    "Describe a real student situation and get a structured action plan grounded in ANU policy, services, and lived experience from r/anu.",
};

const themeBootstrap = `(function(){try{var el=document.documentElement;var m=localStorage.getItem('anu-compass:mode');if(m!=='light'&&m!=='dark'){m=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}el.setAttribute('data-mode',m);var t=localStorage.getItem('anu-compass:theme');if(t==='warm'||t==='navy'||t==='forest'||t==='pure'){el.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
