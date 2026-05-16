import { Roboto, Unbounded } from "next/font/google";
import "./globals.css";
import Footer from '../components/Footer';
import Header from "../components/Header";
import LoggedInHeaderOverlay from "../components/LoggedInHeaderOverlay";
import SettingsNavigation from "../components/SettingsNavigation";
import AuthSessionManager from "../components/AuthSessionManager";
import RootAuroraBackground from "../components/RootAuroraBackground";

const robotoFont = Roboto({
  display: "swap",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  display: "swap",
  subsets: ["latin"],
});


export const metadata = {
  title: "PropWiz | Australian Property Cost Calculator",
  description: "Calculate your property costs",
  icons: {
    icon: "/favicon.png",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="flyingwizard">
      <body className={`${robotoFont.className} relative min-h-screen`}>
        <RootAuroraBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <AuthSessionManager />
          <Header />
          <LoggedInHeaderOverlay />
          <SettingsNavigation />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
