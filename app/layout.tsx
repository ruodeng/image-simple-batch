import type React from "react"
import { MainNav } from "@/components/main-nav"
import "./globals.css"

export const metadata = {
  generator: 'v0.dev'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container mx-auto p-4">
          <MainNav />
           {children}
        </div>
      </body>
    </html>
  )
}
