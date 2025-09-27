"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { useTheme } from "@/lib/hooks/useTheme"

type UserRole = "admin" | "client" | "staff"

interface User {
  name: string
  role: UserRole
}

export function RoleBasedNavigation() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const userName = localStorage.getItem("userName") || "User"
    const userRole = (localStorage.getItem("userRole") as UserRole) || "client"

    setUser({ name: userName, role: userRole })
  }, [router])



  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userName")
    localStorage.removeItem("userRole")
    router.push("/")
  }

  const getNavItems = (role: UserRole) => {
    const baseItems = [{ name: "Dashboard", path: "/dashboard" }]

    switch (role) {
      case "admin":
        return [
          ...baseItems,
          { name: "Utilisateurs", path: "/dashboard/users" },
          { name: "Demandes", path: "/dashboard/requests" },
          { name: "Personnel", path: "/dashboard/staff" },
          { name: "Paiements", path: "/dashboard/payments" },
        ]
      case "client":
        return [
          ...baseItems,
          { name: "Mes Demandes", path: "/dashboard/requests" },
          { name: "Historique", path: "/dashboard/history" },
        ]
      case "staff":
        return [
          ...baseItems,
          { name: "Mes Missions", path: "/dashboard/missions" },
          { name: "Profil", path: "/dashboard/profile" },
        ]
      default:
        return baseItems
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-r from-red-600 to-rose-600"
      case "staff":
        return "bg-gradient-to-r from-orange-600 to-red-600"
      case "client":
        return "bg-gradient-to-r from-rose-600 to-pink-600"
      default:
        return "bg-gray-600"
    }
  }

  const isActivePath = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  if (!user) {
    return null
  }

  const navItems = getNavItems(user.role)

  return (
    <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
            <span className="text-3xl animate-pulse">🗑️</span>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                WasteManager
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gestion intelligente</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant={isActivePath(item.path) ? "default" : "ghost"}
                className={
                  isActivePath(item.path)
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg"
                    : "hover:bg-red-50 dark:hover:bg-gray-700 transition-all duration-300"
                }
                onClick={() => router.push(item.path)}
              >
                {item.name}
              </Button>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <MobileNav
            navItems={navItems.map((item) => item.name)}
            activeItem={navItems.find((item) => isActivePath(item.path))?.name || "Dashboard"}
            onItemClick={(itemName) => {
              const item = navItems.find((nav) => nav.name === itemName)
              if (item) router.push(item.path)
            }}
          />

          {/* User Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="text-2xl hover:bg-red-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
            >
              {darkMode ? "☀️" : "🌙"}
            </Button>

            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${getRoleColor(user.role)} flex items-center justify-center text-white text-sm font-bold shadow-lg hover:scale-105 transition-transform duration-300`}
              >
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                <Badge variant="secondary" className="text-xs font-medium">
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
