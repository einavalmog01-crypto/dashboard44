import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { EnvironmentProvider } from '@/lib/environment-context'

export const metadata = {
  title: 'Dashboard',
  description: 'Your dashboard app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased" suppressHydrationWarning>
        {/* Wrap children in the EnvironmentProvider */}
        <EnvironmentProvider>
          {children}
          <Analytics />
        </EnvironmentProvider>
      </body>
    </html>
  )
}
