import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import Navbar from "@/components/Navbar"
import { Suspense } from 'react'
import { AuthProvider } from "@/utils/userContext"
import AuthGuard from "@/components/AuthGuard"

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["300", "400"],
  variable: '--font-cormorant'
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Wardrobe Daily Pick',
  description: 'Your Smart Wardrobe App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${cormorant.variable}`} suppressHydrationWarning>
        <AuthProvider>
          <AuthGuard>
            <div className="pb-28">
              {children}
            </div>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
