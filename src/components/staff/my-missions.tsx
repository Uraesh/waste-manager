"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Mission {
  id: string
  title: string
  client: string
  status: "assigned" | "in-progress" | "completed" | "on-hold"
  priority: "low" | "medium" | "high"
  location: string
  scheduledDate: string
  estimatedDuration: string
  description: string
  equipment?: string[]
  notes?: string
  completedAt?: string
  photos?: string[]
  gpsLocation?: { lat: number; lng: number }
  timeTracking?: { start?: string; end?: string; duration?: string }
  clientContact?: { phone: string; email: string }
}

const mockMissions: Mission[] = [
  {
    id: "MIS-001",
    title: "Nettoyage bureaux - Société ABC",
    client: "Jean Dupont",
    status: "in-progress",
    priority: "high",
    location: "15 Rue de la Paix, Paris",
    scheduledDate: "2024-01-25",
    estimatedDuration: "3h",
    description: "Nettoyage complet des bureaux du 2ème étage, incluant les vitres et sols.",
    equipment: ["Aspirateur", "Produits nettoyage", "Chiffons"],
    gpsLocation: { lat: 48.8566, lng: 2.3522 },
    clientContact: { phone: "+33 1 23 45 67 89", email: "jean.dupont@abc.com" },
    timeTracking: { start: "09:00", duration: "1h 30min" },
  },
]

export function MyMissions() {
  const [missions, setMissions] = useState<Mission[]>(mockMissions)
  // Removed unused statusFilter state
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  const filteredMissions = missions // No filtering by status since statusFilter is removed

  const updateMissionStatus = (missionId: string, newStatus: Mission["status"]) => {
    setMissions((prev) =>
      prev.map((mission) => (mission.id === missionId ? { ...mission, status: newStatus } : mission)),
    )
  }

  const handlePhotoUpload = (missionId: string) => {
    const newPhoto = `/placeholder.svg?height=200&width=300&query=mission progress photo`
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId ? { ...mission, photos: [...(mission.photos || []), newPhoto] } : mission,
      ),
    )
  }

  const startGPSTracking = (missionId: string) => {
    console.log(`[v0] Starting GPS tracking for mission ${missionId}`)
    // Simulate GPS tracking
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId
          ? { ...mission, gpsLocation: { lat: 48.8566 + Math.random() * 0.01, lng: 2.3522 + Math.random() * 0.01 } }
          : mission,
      ),
    )
  }

  const startTimeTracking = (missionId: string) => {
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId ? { ...mission, timeTracking: { ...mission.timeTracking, start: now } } : mission,
      ),
    )
  }

  const stopTimeTracking = (missionId: string) => {
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    setMissions((prev) =>
      prev.map((mission) => {
        if (mission.id === missionId && mission.timeTracking?.start) {
          const start = new Date(`2024-01-01 ${mission.timeTracking.start}`)
          const end = new Date(`2024-01-01 ${now}`)
          const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
          return {
            ...mission,
            timeTracking: {
              ...mission.timeTracking,
              end: now,
              duration: `${Math.floor(duration / 60)}h ${duration % 60}min`,
            },
          }
        }
        return mission
      }),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Mes Missions
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" className="glass hover:scale-[1.02] transition-transform bg-transparent">
            📍 Localisation
          </Button>
          <Button variant="outline" className="glass hover:scale-[1.02] transition-transform bg-transparent">
            🚨 Signaler un problème
          </Button>
        </div>
      </div>

      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎯</span>
            Missions Assignées ({filteredMissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMissions.map((mission) => (
              <div
                key={mission.id}
                className="p-4 glass rounded-lg hover:scale-[1.01] transition-all duration-300 border border-border/50 hover:border-primary/30"
              >
                <div className="flex flex-wrap gap-2">
                  {mission.status === "assigned" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMissionStatus(mission.id, "in-progress")
                          startTimeTracking(mission.id)
                          startGPSTracking(mission.id)
                        }}
                        className="bg-gradient-to-r from-primary to-accent hover:scale-[1.02] transition-transform"
                      >
                        🚀 Commencer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startGPSTracking(mission.id)}
                        className="glass"
                      >
                        📍 GPS
                      </Button>
                    </>
                  )}
                  {mission.status === "in-progress" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMissionStatus(mission.id, "completed")
                          stopTimeTracking(mission.id)
                        }}
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:scale-[1.02] transition-transform"
                      >
                        ✅ Terminer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePhotoUpload(mission.id)}
                        className="glass"
                      >
                        📸 Photo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopTimeTracking(mission.id)}
                        className="glass"
                      >
                        ⏱️ Stop
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setSelectedMission(mission)} className="glass">
                    📋 Détails
                  </Button>
                  {mission.clientContact && (
                    <Button variant="outline" size="sm" className="glass bg-transparent">
                      📞 Client
                    </Button>
                  )}
                </div>

                {mission.timeTracking && (
                  <div className="mt-3 p-2 glass-strong rounded-lg">
                    <div className="flex items-center gap-4 text-sm">
                      {mission.timeTracking.start && <span>⏰ Début: {mission.timeTracking.start}</span>}
                      {mission.timeTracking.duration && <span>⏱️ Durée: {mission.timeTracking.duration}</span>}
                      {mission.status === "in-progress" && (
                        <span className="text-green-500 animate-pulse">🔴 En cours</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMission && (
        <Card className="glass border-primary/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Mission {selectedMission.id}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMission(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 glass">
                <TabsTrigger value="details">📋 Détails</TabsTrigger>
                <TabsTrigger value="progress">📊 Progrès</TabsTrigger>
                <TabsTrigger value="photos">📸 Photos</TabsTrigger>
                <TabsTrigger value="communication">💬 Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4"></TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Suivi du Temps</h4>
                  {selectedMission.timeTracking ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 glass-strong rounded-lg">
                        <p className="text-sm text-muted-foreground">Heure de début</p>
                        <p className="font-semibold">{selectedMission.timeTracking.start || "Non démarré"}</p>
                      </div>
                      <div className="p-3 glass-strong rounded-lg">
                        <p className="text-sm text-muted-foreground">Durée actuelle</p>
                        <p className="font-semibold">{selectedMission.timeTracking.duration || "En cours..."}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun suivi de temps disponible</p>
                  )}

                  {selectedMission.gpsLocation && (
                    <div>
                      <h4 className="font-semibold mb-2">Position GPS</h4>
                      <div className="p-3 glass-strong rounded-lg">
                        <p className="text-sm">
                          📍 Lat: {selectedMission.gpsLocation.lat.toFixed(4)}, Lng:{" "}
                          {selectedMission.gpsLocation.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Photos de Mission</h4>
                    <Button
                      size="sm"
                      onClick={() => handlePhotoUpload(selectedMission.id)}
                      className="bg-gradient-to-r from-primary to-accent"
                    >
                      📸 Ajouter Photo
                    </Button>
                  </div>
                  {selectedMission.photos && selectedMission.photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedMission.photos.map((photo, index) => (
                        <Image
                          key={index}
                          src={photo || "/placeholder.svg"}
                          alt={`Mission photo ${index + 1}`}
                          width={300}
                          height={128}
                          className="w-full h-32 object-cover"
                          style={{ objectFit: "cover" }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Aucune photo ajoutée</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Contact Client</h4>
                  {selectedMission.clientContact ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-gradient-to-r from-green-600 to-green-500">
                          📞 {selectedMission.clientContact.phone}
                        </Button>
                        <Button variant="outline" className="flex-1 glass bg-transparent">
                          📧 Email
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message rapide</Label>
                        <Textarea id="message" placeholder="Envoyer un message au client..." className="glass-strong" />
                        <Button className="w-full bg-gradient-to-r from-primary to-accent">Envoyer Message</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Informations de contact non disponibles</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
