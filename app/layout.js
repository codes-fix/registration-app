import { Inter } from 'next/font/google'
import "./globals.css";
import ColorProvider from '@/components/ColorProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'At The Roc - Event Registration & Management',
  description: 'Professional event registration and management platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <ColorProvider>
          {children}
        </ColorProvider>
      </body>
    </html>
  );
}