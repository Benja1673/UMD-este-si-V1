    // app/layout.tsx
    import "./globals.css"
    import { Providers } from "./providers"
    import type { Metadata } from "next"

    export const metadata: Metadata = {
      title: "Plataforma Académica UTEM",
      description: "Gestión de docentes, supervisores y capacitaciones",
    }

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="es">
          <body>
            <Providers>
              {children}
            </Providers>
          </body>
        </html>
      )
    }
