import { Roboto, Unbounded } from "next/font/google";
import "./globals.css";
import Footer from '../components/Footer';
import Header from "../components/Header";

const robotoFont = Roboto({
  display: "swap",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  display: "swap",
  subsets: ["latin"],
});


export const metadata = {
  title: "Property Calculator",
  description: "Calculate your property costs",
  icons: {
    icon: "/favicon.png",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="flyingwizard">
      <body
        className={robotoFont.className}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
