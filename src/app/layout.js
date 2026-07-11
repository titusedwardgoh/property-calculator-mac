import { Roboto, Unbounded } from "next/font/google";
import "./globals.css";
import Footer from '../components/Footer';
import Header from "../components/Header";
import LoggedInHeaderOverlay from "../components/LoggedInHeaderOverlay";
import AuthSessionManager from "../components/AuthSessionManager";
import LogoutOverlay from "../components/LogoutOverlay";
import RootAuroraBackground from "../components/RootAuroraBackground";
import AuthProvider from "@/contexts/AuthProvider";
import { getInitialAuthState } from "@/lib/auth/getInitialAuthState";
import { Analytics } from "@vercel/analytics/next";

const robotoFont = Roboto({
  display: "swap",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  display: "swap",
  subsets: ["latin"],
});


export const metadata = {
  title: "Proppers | Australian Property Cost Calculator",
  description: "Calculate your property costs",
  icons: {
    icon: "/favicon.png",
  }
};

export default async function RootLayout({ children }) {
  const initialAuth = await getInitialAuthState();

  return (
    <html lang="en" data-theme="flyingwizard">
      <body className={`${robotoFont.className} relative min-h-screen`}>
        <AuthProvider initialAuth={initialAuth}>
          <RootAuroraBackground />
          <div className="relative z-10 flex min-h-screen flex-col">
            <AuthSessionManager />
            <LogoutOverlay />
            <Header />
            <LoggedInHeaderOverlay />
            {children}
            <Footer />
          </div>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
