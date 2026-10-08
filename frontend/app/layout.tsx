import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { Navbar } from "@/components/Navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MeatScan AI | Automated Beef Quality Assessment",
  description: "Computer vision and ReXNet-150 machine learning evaluation for beef freshness, marbling, and Meat Quality Score (MQS).",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
