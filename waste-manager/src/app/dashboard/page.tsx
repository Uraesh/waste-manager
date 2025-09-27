"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KPICard } from "@/components/dashboard/kpi-card"
import { ActivityTimeline } from "@/components/dashboard/activity-timeline"
import { RoleBasedNavigation } from "@/components/navigation/role-nav"
import { useTheme } from "@/lib/hooks/useTheme"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type UserRole = "admin" | "client" | "staff"

interface User {
  name: string
  role: UserRole
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  useTheme()

  // Weather state
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number; label: string } | null>(null)
  const [cityInput, setCityInput] = useState("")

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Get user data
    const userName = localStorage.getItem("userName") || "User"
    const userRole = (localStorage.getItem("userRole") as UserRole) || "client"

    setUser({ name: userName, role: userRole })
  }, [router])

  // Fetch current weather using browser geolocation and Open-Meteo (no API key required)
  useEffect(() => {
    let cancelled = false

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        setWeatherLoading(true)
        setWeatherError(null)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const cw = data.current_weather
        setWeather({ temp: cw.temperature, code: cw.weathercode })
      } catch {
        if (cancelled) return
        setWeatherError("Impossible de récupérer la météo")
      } finally {
        if (!cancelled) setWeatherLoading(false)
      }
    }

    const setAndFetch = (lat: number, lon: number, label: string) => {
      setLocation({ lat, lon, label })
      fetchWeather(lat, lon)
    }

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setAndFetch(latitude, longitude, "Votre position")
        },
        () => {
          // Fallback: Paris centre
          setAndFetch(48.8566, 2.3522, "Paris, FR")
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      )
    } else {
      // Fallback: Paris centre
      setAndFetch(48.8566, 2.3522, "Paris, FR")
    }

    return () => {
      cancelled = true
    }
  }, [])

  // Auto refresh every 15 minutes based on current selected location
  useEffect(() => {
    if (!location) return
    const interval = setInterval(() => {
      // Silent refresh: keep last label
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) => {
          const cw = data.current_weather
          setWeather({ temp: cw.temperature, code: cw.weathercode })
        })
        .catch(() => {
          // Do not spam errors; keep last value
        })
    }, 15 * 60 * 1000) // 15 minutes
    return () => clearInterval(interval)
  }, [location])

  const weatherFromCode = (code: number) => {
    // Minimal mapping for common codes (Open-Meteo weather codes)
    const map: Record<string, { icon: string; label: string }> = {
      "0": { icon: "☀️", label: "Ensoleillé" },
      "1": { icon: "🌤️", label: "Principalement clair" },
      "2": { icon: "⛅", label: "Partiellement nuageux" },
      "3": { icon: "☁️", label: "Couvert" },
      "45": { icon: "🌫️", label: "Brouillard" },
      "48": { icon: "🌫️", label: "Brouillard givrant" },
      "51": { icon: "🌦️", label: "Bruine légère" },
      "53": { icon: "🌦️", label: "Bruine" },
      "55": { icon: "🌧️", label: "Bruine forte" },
      "61": { icon: "🌦️", label: "Pluie faible" },
      "63": { icon: "🌧️", label: "Pluie" },
      "65": { icon: "🌧️", label: "Pluie forte" },
      "71": { icon: "🌨️", label: "Neige légère" },
      "73": { icon: "🌨️", label: "Neige" },
      "75": { icon: "❄️", label: "Neige forte" },
      "95": { icon: "⛈️", label: "Orages" },
      "96": { icon: "⛈️", label: "Orages avec grêle" },
      "99": { icon: "⛈️", label: "Orages forts" },
    }
    return map[String(code)] ?? { icon: "🌡️", label: "Conditions" }
  }

  // Search city via Open-Meteo Geocoding
  const searchCity = async (q: string) => {
    if (!q.trim()) return
    try {
      setWeatherLoading(true)
      setWeatherError(null)
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=fr&format=json`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const first = data?.results?.[0]
      if (!first) {
        setWeatherError("Ville introuvable")
        setWeatherLoading(false)
        return
      }
      const lat = first.latitude
      const lon = first.longitude
      const label = [first.name, first.admin1, first.country_code].filter(Boolean).join(", ")
      setLocation({ lat, lon, label })
      // Fetch weather for that city
      const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      if (!wRes.ok) throw new Error(`HTTP ${wRes.status}`)
      const wData = await wRes.json()
      const cw = wData.current_weather
      setWeather({ temp: cw.temperature, code: cw.weathercode })
    } catch {
      setWeatherError("Erreur lors de la recherche de la ville")
    } finally {
      setWeatherLoading(false)
    }
  }

  const getKPIData = (role: UserRole) => {
    const baseKPIs = [
      {
        title: "Demandes actives",
        value: "24",
        icon: "📋",
        color: "border-red-500",
        trend: { value: 12, isPositive: true },
        subtitle: "vs mois dernier",
      },
      {
        title: "En cours",
        value: "12",
        icon: "⏳",
        color: "border-orange-500",
        trend: { value: 8, isPositive: false },
        subtitle: "missions assignées",
      },
      {
        title: "Terminées",
        value: "156",
        icon: "✅",
        color: "border-green-500",
        trend: { value: 23, isPositive: true },
        subtitle: "ce mois",
      },
      {
        title: "Personnel actif",
        value: "8",
        icon: "👥",
        color: "border-rose-500",
        subtitle: "disponible maintenant",
      },
    ]

    if (role === "client") {
      return [
        { ...baseKPIs[0], title: "Mes demandes", value: "3" },
        { ...baseKPIs[1], title: "En attente", value: "1" },
        { ...baseKPIs[2], title: "Terminées", value: "12" },
        { ...baseKPIs[3], title: "Satisfaction", value: "4.8", icon: "⭐" },
      ]
    }

    if (role === "staff") {
      return [
        { ...baseKPIs[0], title: "Mes missions", value: "5" },
        { ...baseKPIs[1], title: "Aujourd'hui", value: "2" },
        { ...baseKPIs[2], title: "Terminées", value: "28" },
        { ...baseKPIs[3], title: "Note moyenne", value: "4.9", icon: "⭐" },
      ]
    }

    return baseKPIs
  }

  const getActivityData = () => {
    const baseActivities = [
      {
        id: "1",
        action: "Nouvelle demande de collecte créée",
        time: "Il y a 5 min",
        status: "En attente" as const,
        user: "Marie Dubois",
        location: "15 Rue de la Paix, Paris",
      },
      {
        id: "2",
        action: "Mission assignée à Jean Dupont",
        time: "Il y a 15 min",
        status: "En cours" as const,
        location: "Zone industrielle Nord",
      },
      {
        id: "3",
        action: "Collecte terminée avec succès",
        time: "Il y a 1h",
        status: "Terminé" as const,
        user: "Pierre Martin",
        location: "Centre commercial",
      },
      {
        id: "4",
        action: "Demande urgente signalée",
        time: "Il y a 2h",
        status: "Urgent" as const,
        location: "Hôpital Saint-Louis",
      },
    ]

    return baseActivities
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-rose-950 to-orange-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/80">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen transition-all duration-500 bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <RoleBasedNavigation />

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Bienvenue, {user.name} -{" "}
                {user.role === "admin" ? "Administrateur" : user.role === "staff" ? "Personnel" : "Client"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleTimeString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getKPIData(user.role).map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              color={kpi.color}
              trend={kpi.trend}
              subtitle={kpi.subtitle}
            />
          ))}
        </div>

        {/* Enhanced Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityTimeline activities={getActivityData()} />
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg p-6 border border-white/20 dark:border-gray-700/20">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4">
                Actions rapides
              </h3>
              <div className="space-y-3">
                {user.role === "admin" && (
                  <>
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                      onClick={() => router.push("/dashboard/requests")}
                    >
                      ➕ Nouvelle demande
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-red-50 dark:hover:bg-gray-700 bg-transparent"
                      onClick={() => router.push("/dashboard/users")}
                    >
                      👥 Gérer les utilisateurs
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-red-50 dark:hover:bg-gray-700 bg-transparent"
                      onClick={() => router.push("/dashboard/staff")}
                    >
                      📊 Gérer le personnel
                    </Button>
                  </>
                )}
                {user.role === "client" && (
                  <>
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                      onClick={() => router.push("/dashboard/requests")}
                    >
                      📋 Nouvelle demande
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-red-50 dark:hover:bg-gray-700 bg-transparent"
                      onClick={() => router.push("/dashboard/history")}
                    >
                      📍 Voir l&apos;historique
                    </Button>
                  </>
                )}
                {user.role === "staff" && (
                  <>
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                      onClick={() => router.push("/dashboard/missions")}
                    >
                      🎯 Voir mes missions
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-red-50 dark:hover:bg-gray-700 bg-transparent"
                      onClick={() => router.push("/dashboard/profile")}
                    >
                      📱 Mon profil
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Weather/Status Widget */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg p-6 border border-white/20 dark:border-gray-700/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conditions</h3>

              {/* City search */}
              <form
                className="flex gap-2 mb-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  searchCity(cityInput)
                }}
              >
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Rechercher une ville"
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
                <Button type="submit" className="bg-gradient-to-r from-red-600 to-rose-600">
                  Chercher
                </Button>
              </form>

              {location && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Lieu: {location.label}</div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Météo</span>
                  <div className="flex items-center gap-2">
                    {weatherLoading ? (
                      <>
                        <span className="animate-pulse">⏳</span>
                        <span className="text-sm font-medium">Chargement…</span>
                      </>
                    ) : weatherError ? (
                      <>
                        <span>⚠️</span>
                        <span className="text-sm font-medium">{weatherError}</span>
                      </>
                    ) : weather ? (
                      <>
                        <span>{weatherFromCode(weather.code).icon}</span>
                        <span className="text-sm font-medium">{Math.round(weather.temp)}°C</span>
                      </>
                    ) : (
                      <>
                        <span>🌡️</span>
                        <span className="text-sm font-medium">N/A</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Trafic</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Fluide</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Système</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></div>
                    <span className="text-sm text-green-600 dark:text-green-400">Opérationnel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
