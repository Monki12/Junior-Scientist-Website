
import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import MainNav from '@/components/layout/main-nav';
import SiteFooter from '@/components/layout/site-footer';
import { ThemeProvider } from '@/contexts/theme-provider';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Junior Scientist',
  description: 'The official platform for the Junior Scientist event. Explore, register, and manage your participation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background text-foreground" suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MainNav /> 
            <main className="flex-grow">
              {children}
            </main>
            <SiteFooter />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
