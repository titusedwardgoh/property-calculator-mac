import { Cormorant, Unbounded } from "next/font/google";
import "./globals.css";

const cormorantFont = Cormorant({
  display: "swap",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  display: "swap",
  subsets: ["latin"],
});


export const metadata = {
  title: "Property Calculator",
  description: "Change description",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" }
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="corporate">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
      </head>
      <body
        className={cormorantFont.className}
      >
        {children}
        <footer className="">
          <div className = "bg-accent text-base-100">Footer goes here</div>
        </footer>
      </body>
    </html>
  );
}
