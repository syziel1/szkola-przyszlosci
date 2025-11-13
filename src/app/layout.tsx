import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers'; // <-- WAŻNE
import "./globals.css";
import { NonceProvider } from "@/lib/nonce-context";
import { NoncedScript } from "@/components/nonced-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Szkoła Przyszłości",
  description: "System zarządzania uczniami",
};

export default async function RootLayout({ // <-- async component
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Pobieramy nonce wygenerowany przez middleware
  const headersList = await headers(); 
  const nonce = headersList.get('x-nonce');

  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NonceProvider nonce={nonce}>
          {/* Tu w przyszłości wróci AuthProvider i Toaster */}
          {children}
          
          {/* Testowy skrypt sprawdzający, czy nonce działa (powinien się wykonać) */}
          {nonce && (
            <NoncedScript
              id="csp-nonce-check"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{ __html: 'console.log("CSP Nonce check: OK");' }}
            />
          )}
        </NonceProvider>
      </body>
    </html>
  );
}