"use client"

import { CardContent } from "@/components/ui/card"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { StaffProfileType } from "@/types/staff-profile" // Assuming StaffProfile type is defined here
import { mockProfile } from "@/mocks/mock-profile" // Assuming mockProfile is defined here

export function StaffProfileComponent() {
  const [profile] = useState<StaffProfileType>(mockProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [notifications, setNotifications] = useState({
    newMissions: true,
    statusUpdates: true,
    clientMessages: true,
    emergencyAlerts: true,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Mon Profil — {profile.name}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" className="glass hover:scale-[1.02] transition-transform bg-transparent">
            📊 Statistiques
          </Button>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-gradient-to-r from-primary to-accent hover:scale-[1.02] transition-transform shadow-lg"
          >
            {isEditing ? "💾 Sauvegarder" : "✏️ Modifier"}
          </Button>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔔</span>
            Préférences de Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 glass-strong rounded-lg">
                <span className="capitalize">
                  {key === "newMissions" && "🎯 Nouvelles missions"}
                  {key === "statusUpdates" && "📊 Mises à jour"}
                  {key === "clientMessages" && "💬 Messages clients"}
                  {key === "emergencyAlerts" && "🚨 Alertes urgentes"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotifications((prev) => ({ ...prev, [key]: !value }))}
                  className={value ? "bg-green-500/20 border-green-500" : "glass"}
                >
                  {value ? "✅" : "❌"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
