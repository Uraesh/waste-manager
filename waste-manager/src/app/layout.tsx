/**
 * @fileoverview Layout racine de l'application
 * Définit la structure de base commune à toutes les pages
 * Configure les polices, le langage et les métadonnées de l'application
 */

import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "WasteManager - Gestion des déchets",
  description: "Application de gestion des demandes de collecte de déchets",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
