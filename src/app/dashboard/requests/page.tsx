"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RoleBasedNavigation } from "@/components/navigation/role-nav"
import { RequestModal } from "@/components/request-management/request-modal"
import { RequestDetailsModal } from "@/components/request-management/request-details-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mapping des couleurs par statut
const STATUS_COLORS = {
  "En attente": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  "En cours": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  "Terminé": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  "Annulé": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
} as const

// Mapping des couleurs par priorité
const PRIORITY_COLORS = {
  "Urgente": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  "Haute": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  "Normale": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  "Basse": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
} as const

// Mapping des icônes par type
const TYPE_ICONS = {
  "Collecte": "🗑️",
  "Recyclage": "♻️",
  "Déchets spéciaux": "⚠️",
  "Urgence": "🚨"
} as const

// Textes par rôle
const ROLE_TEXTS = {
  client: {
    title: "Mes demandes",
    description: "Suivez vos demandes de collecte"
  },
  staff: {
    title: "Mes missions",
    description: "Gérez vos missions assignées"
  },
  admin: {
    title: "Gestion des demandes",
    description: "Gérez toutes les demandes de collecte"
  }
} as const

// Options de filtre prédéfinies
const FILTER_OPTIONS = {
  status: [
    { value: "all", label: "Tous les statuts" },
    { value: "En attente", label: "En attente" },
    { value: "En cours", label: "En cours" },
    { value: "Terminé", label: "Terminé" },
    { value: "Annulé", label: "Annulé" }
  ],
  type: [
    { value: "all", label: "Tous les types" },
    { value: "Collecte", label: "Collecte" },
    { value: "Recyclage", label: "Recyclage" },
    { value: "Déchets spéciaux", label: "Déchets spéciaux" },
    { value: "Urgence", label: "Urgence" }
  ],
  priority: [
    { value: "all", label: "Toutes les priorités" },
    { value: "Basse", label: "Basse" },
    { value: "Normale", label: "Normale" },
    { value: "Haute", label: "Haute" },
    { value: "Urgente", label: "Urgente" }
  ],
  sort: [
    { value: "newest", label: "Plus récent" },
    { value: "oldest", label: "Plus ancien" },
    { value: "priority", label: "Priorité" },
    { value: "status", label: "Statut" }
  ]
}

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

interface CurrentUser {
  name: string
  role: "client" | "staff" | "admin" | null
}

export default function RequestsPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/login") // Redirect to login if not authenticated
      return
    }

    const userRole = localStorage.getItem("userRole")
    setCurrentUser({
      name: localStorage.getItem("userName") || "User",
      role: userRole as CurrentUser["role"],
    })

    // Mock requests data with more detailed information
    setRequests([
      {
        id: "REQ-001",
        title: "Collecte de déchets industriels",
        client: "Marie Dubois",
        location: "15 Rue de la Paix, 75001 Paris",
        type: "Collecte",
        status: "En attente",
        priority: "Haute",
        createdAt: "2024-01-15T10:30:00",
        description:
          "Collecte urgente de déchets industriels non dangereux. Environ 2 tonnes de matériaux divers incluant du métal, du plastique et du carton.",
        estimatedDuration: "2h",
        contactPhone: "+33 1 23 45 67 89",
        specialInstructions: "Accès par la cour arrière. Prévoir un camion de taille moyenne.",
      },
      {
        id: "REQ-002",
        title: "Recyclage papier bureau",
        client: "Entreprise ABC",
        location: "Zone industrielle Nord, 93200 Saint-Denis",
        type: "Recyclage",
        status: "En cours",
        priority: "Normale",
        createdAt: "2024-01-14T14:20:00",
        assignedTo: "Jean Dupont",
        description:
          "Collecte hebdomadaire de papier de bureau. Environ 500kg de documents à détruire de manière sécurisée.",
        estimatedDuration: "1h",
        contactPhone: "+33 1 98 76 54 32",
      },
      {
        id: "REQ-003",
        title: "Déchets médicaux DASRI",
        client: "Hôpital Saint-Louis",
        location: "1 Avenue Claude Vellefaux, 75010 Paris",
        type: "Déchets spéciaux",
        status: "Terminé",
        priority: "Urgente",
        createdAt: "2024-01-13T08:15:00",
        assignedTo: "Pierre Martin",
        description:
          "Collecte de déchets médicaux selon protocole DASRI. Contenants spécialisés fournis par l'hôpital.",
        estimatedDuration: "1h",
        contactPhone: "+33 1 42 49 49 49",
        specialInstructions: "Respecter strictement le protocole DASRI. Équipements de protection obligatoires.",
      },
      {
        id: "REQ-004",
        title: "Urgence - Déversement accidentel",
        client: "Garage Moderne",
        location: "45 Boulevard de la République, 92100 Boulogne",
        type: "Urgence",
        status: "En cours",
        priority: "Urgente",
        createdAt: "2024-01-16T16:45:00",
        assignedTo: "Sophie Laurent",
        description:
          "Déversement accidentel d'huile moteur dans la cour. Intervention urgente requise pour éviter la contamination.",
        estimatedDuration: "4h",
        contactPhone: "+33 1 55 66 77 88",
        specialInstructions: "Matériel absorbant nécessaire. Intervention dans les 2h maximum.",
      },
    ])
  }, [router])

  const FilterSelect = ({ value, onValueChange, options, placeholder }: {
    value: string
    onValueChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder: string
  }) => {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="bg-white/50 dark:bg-gray-700/50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS["En attente"]
  }

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS["Normale"]
  }

  const getTypeIcon = (type: string) => {
    return TYPE_ICONS[type as keyof typeof TYPE_ICONS] || "📋"
  }

  const handleCreateRequest = () => {
    setModalMode("create")
    setSelectedRequest(null)
    setIsRequestModalOpen(true)
  }

  const handleEditRequest = (request: Request) => {
    setModalMode("edit")
    setSelectedRequest(request)
    setIsRequestModalOpen(true)
  }

  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request)
    setIsDetailsModalOpen(true)
  }

  const handleSaveRequest = (requestData: Partial<Request>) => {
    if (modalMode === "create") {
      setRequests((prev) => [requestData as Request, ...prev])
    } else {
      setRequests((prev) => prev.map((req) => (req.id === requestData.id ? { ...req, ...requestData } : req)))
    }
  }

  const handleAssignRequest = (requestId: string, staffMember: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, assignedTo: staffMember, status: "En cours" as const } : req,
      ),
    )
  }

  const filterRequests = (requests: Request[], user: CurrentUser | null, filters: {
    search: string
    status: string
    type: string
    priority: string
  }) => {
    return requests.filter((request) => {
      const matchesSearch =
        request.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        request.client.toLowerCase().includes(filters.search.toLowerCase()) ||
        request.location.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus = filters.status === "all" || request.status === filters.status
      const matchesType = filters.type === "all" || request.type === filters.type
      const matchesPriority = filters.priority === "all" || request.priority === filters.priority

      const roleBasedFilter = user?.role === "client"
        ? request.client === user.name
        : user?.role === "staff"
          ? request.assignedTo === user.name || request.status === "En attente"
          : true

      return matchesSearch && matchesStatus && matchesType && matchesPriority && roleBasedFilter
    })
  }

  const filteredAndSortedRequests = filterRequests(
    requests,
    currentUser,
    {
      search: searchTerm,
      status: filterStatus,
      type: filterType,
      priority: filterPriority
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "priority": {
          const priorityOrder = { Urgente: 4, Haute: 3, Normale: 2, Basse: 1 }
          return (
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
          )
        }
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <RoleBasedNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
                {ROLE_TEXTS[currentUser.role || "client"].title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {ROLE_TEXTS[currentUser.role || "client"].description}{" "}
                ({filteredAndSortedRequests.length} demandes)
              </p>
            </div>
            <Button
              onClick={handleCreateRequest}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              + Nouvelle demande
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="p-6 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-2">
              <Input
                placeholder="Rechercher par titre, client ou localisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/50 dark:bg-gray-700/50"
              />
            </div>

            <FilterSelect
              value={filterStatus}
              onValueChange={setFilterStatus}
              options={FILTER_OPTIONS.status}
              placeholder="Statut"
            />

            <FilterSelect
              value={filterType}
              onValueChange={setFilterType}
              options={FILTER_OPTIONS.type}
              placeholder="Type"
            />

            <FilterSelect
              value={filterPriority}
              onValueChange={setFilterPriority}
              options={FILTER_OPTIONS.priority}
              placeholder="Priorité"
            />

            <FilterSelect
              value={sortBy}
              onValueChange={setSortBy}
              options={FILTER_OPTIONS.sort}
              placeholder="Trier par"
            />
          </div>
        </Card>

        {/* Enhanced Requests List */}
        <div className="space-y-4">
          {filteredAndSortedRequests.map((request) => (
            <Card
              key={request.id}
              className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
              onClick={() => handleViewDetails(request)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getTypeIcon(request.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        {request.title}
                      </h3>
                      <Badge className="text-xs font-medium">{request.id}</Badge>
                      {request.priority === "Urgente" && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 animate-pulse">
                          🚨 URGENT
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>
                        <strong>Client:</strong> {request.client}
                      </p>
                      <p>
                        <strong>Localisation:</strong> {request.location}
                      </p>
                      <p>
                        <strong>Type:</strong> {request.type}
                      </p>
                      {request.estimatedDuration && (
                        <p>
                          <strong>Durée:</strong> {request.estimatedDuration}
                        </p>
                      )}
                    </div>
                    {request.assignedTo && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <strong>Assigné à:</strong> {request.assignedTo}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                  <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{request.description}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(request)
                    }}
                  >
                    Voir détails
                  </Button>
                  {currentUser.role === "admin" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditRequest(request)
                        }}
                      >
                        Modifier
                      </Button>
                      {request.status === "En attente" && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Quick assign logic here
                          }}
                        >
                          Assigner
                        </Button>
                      )}
                    </>
                  )}
                  {currentUser.role === "staff" &&
                    request.assignedTo === currentUser.name &&
                    request.status === "En cours" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAssignRequest(request.id, currentUser.name)
                        }}
                      >
                        Marquer terminé
                      </Button>
                    )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Créé le {new Date(request.createdAt).toLocaleString("fr-FR")}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAndSortedRequests.length === 0 && (
          <Card className="p-12 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune demande trouvée</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Essayez de modifier vos critères de recherche ou créez une nouvelle demande
            </p>
          </Card>
        )}
      </div>

      {/* Modals */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSave={handleSaveRequest}
        request={selectedRequest}
        mode={modalMode}
        currentUserRole={currentUser.role || ""}
      />

      <RequestDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        request={selectedRequest}
        currentUserRole={currentUser.role || ""}
        currentUserName={currentUser.name}
      />
    </div>
  )
}
