"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
 

interface Request {
  id: string
  title: string
  client: string
  location: string
  type: "Collecte" | "Recyclage" | "Déchets spéciaux" | "Urgence"
  status: "En attente" | "En cours" | "Terminé" | "Annulé"
  priority: "Basse" | "Normale" | "Haute" | "Urgente"
  createdAt: string
  assignedTo?: string
  description: string
  estimatedDuration?: string
  contactPhone?: string
  specialInstructions?: string
}

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  type: "comment" | "status_change" | "assignment"
}

interface RequestDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  request: Request | null
  currentUserRole: string
  currentUserName: string
}

export function RequestDetailsModal({
  isOpen,
  onClose,
  request,
  currentUserRole,
  currentUserName,
}: RequestDetailsModalProps) {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Admin User",
      content: "Demande créée et en attente d'assignation",
      timestamp: "Il y a 2h",
      type: "status_change",
    },
    {
      id: "2",
      author: "Jean Dupont",
      content: "J'ai vérifié la localisation, l'accès semble facile. Je peux m'en occuper demain matin.",
      timestamp: "Il y a 1h",
      type: "comment",
    },
  ])

  if (!request) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En attente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "En cours":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "Terminé":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Annulé":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgente":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "Haute":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "Normale":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "Basse":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Collecte":
        return "🗑️"
      case "Recyclage":
        return "♻️"
      case "Déchets spéciaux":
        return "⚠️"
      case "Urgence":
        return "🚨"
      default:
        return "📋"
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: currentUserName,
      content: newComment,
      timestamp: "Maintenant",
      type: "comment",
    }

    setComments((prev) => [comment, ...prev])
    setNewComment("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                {request.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="text-xs font-medium">{request.id}</Badge>
                <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
              </div>
            </div>
            <div className="text-4xl">{getTypeIcon(request.type)}</div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="comments">Communication</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4 bg-white/60 dark:bg-gray-800/60">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Informations générales</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Client:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{request.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{request.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Créé le:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {request.estimatedDuration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Durée estimée:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{request.estimatedDuration}</span>
                    </div>
                  )}
                  {request.assignedTo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Assigné à:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{request.assignedTo}</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 bg-white/60 dark:bg-gray-800/60">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Contact & Localisation</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Adresse:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">{request.location}</p>
                  </div>
                  {request.contactPhone && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Téléphone:</span>
                      <p className="font-medium text-gray-900 dark:text-white mt-1">{request.contactPhone}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent"
                >
                  📍 Voir sur la carte
                </Button>
              </Card>
            </div>

            <Card className="p-4 bg-white/60 dark:bg-gray-800/60">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{request.description}</p>
            </Card>

            {request.specialInstructions && (
              <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-3">Instructions spéciales</h3>
                <p className="text-orange-800 dark:text-orange-200 leading-relaxed">{request.specialInstructions}</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card className="p-4 bg-white/60 dark:bg-gray-800/60">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-rose-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {currentUserName.charAt(0)}
                </div>
                <div className="flex-1">
                  <Textarea
                    id="newComment"
                    name="newComment"
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white/50 dark:bg-gray-700/50 mb-2"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  >
                    Publier
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4 bg-white/60 dark:bg-gray-800/60">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {comment.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{comment.author}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{comment.timestamp}</span>
                        {comment.type === "status_change" && (
                          <Badge variant="secondary" className="text-xs">
                            Changement de statut
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              {[
                { action: "Demande créée", time: "Il y a 2h", user: "Admin User" },
                { action: "Priorité définie comme 'Haute'", time: "Il y a 2h", user: "Admin User" },
                { action: "Assignée à Jean Dupont", time: "Il y a 1h30", user: "Admin User" },
                { action: "Statut changé vers 'En cours'", time: "Il y a 1h", user: "Jean Dupont" },
              ].map((event, index) => (
                <Card key={index} className="p-4 bg-white/60 dark:bg-gray-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{event.action}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Par {event.user} • {event.time}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
          >
            Fermer
          </Button>
          {currentUserRole === "admin" && (
            <Button className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
              Modifier la demande
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
