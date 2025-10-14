"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RoleBasedNavigation } from "@/components/navigation/role-nav"
import { UserModal } from "@/components/user-management/user-modal"
import { DeleteUserModal } from "@/components/user-management/delete-user-modal"
import { Checkbox } from "@/components/ui/checkbox"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "client" | "staff"
  status: "active" | "inactive"
  joinDate: string
  lastActive: string
  phone?: string
  address?: string
}

interface CurrentUser {
  id: string
  email: string
  full_name: string
  role: "admin" | "client" | "staff"
}

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/users")
        const data = await response.json()

        if (!response.ok) {
          // This will catch the 403 error and display our custom message
          throw new Error(data.message || "Une erreur est survenue lors de la récupération des utilisateurs.")
        }

        // The API returns users with 'full_name' and 'created_at'. We map them to our component's 'User' interface.
        interface ApiUser {
          id: string
          full_name: string
          email: string
          role: "admin" | "client" | "staff"
          created_at: string
        }

        const formattedUsers = data.map((user: ApiUser) => ({
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          status: "active", // Default status, as this is not in our 'users' table
          joinDate: user.created_at,
          lastActive: "N/A", // This info is not available from the API
        }))
        setUsers(formattedUsers)
      } catch (err: Error | unknown) {
        const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue s'est produite"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    // Client-side check to see if the user is an admin before attempting to fetch data.
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "admin") {
      // Immediately set an error message without even calling the API.
      // The API has its own server-side check, but this provides a faster response for non-admins.
      setError("Cette porte ne s’ouvre qu’aux âmes autorisées…")
      setIsLoading(false)
      return
    }

    setCurrentUser({
      id: localStorage.getItem("userId") ?? "local",
      email: localStorage.getItem("userEmail") ?? "",
      full_name: localStorage.getItem("userName") ?? "",
      role: userRole as "admin" | "client" | "staff",
    })

    fetchUsers()
  }, [router])

  const getRoleColor = (role: string) => {
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "staff":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "client":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const handleCreateUser = () => {
    setModalMode("create")
    setSelectedUser(null)
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setModalMode("edit")
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleSaveUser = (savedUser: Partial<User>) => {
    // This function is called after a successful API operation in the modal.
    // It updates the local state to reflect the change immediately.
    if (modalMode === "create") {
      // Add the new user to the top of the list
      setUsers((prev) => [savedUser as User, ...prev])
    } else {
      // Find the user in the list and update their details
      setUsers((prev) =>
        prev.map((user) => (user.id === savedUser.id ? { ...user, ...savedUser } : user)),
      )
    }
  }

  const handleConfirmDelete = (userId: string) => {
    // This function is called after a successful delete operation in the modal.
    // It removes the user from the local state.
    setUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    if (action === "delete") {
      setUsers((prev) => prev.filter((user) => !selectedUsers.includes(user.id)))
    } else {
      const newStatus = action === "activate" ? "active" : "inactive"
      setUsers((prev) =>
        prev.map((user) => (selectedUsers.includes(user.id) ? { ...user, status: newStatus as User['status'] } : user)),
      )
    }
    setSelectedUsers([])
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Chargement des utilisateurs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-red-200 dark:border-red-800 shadow-2xl">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Accès Refusé</h2>
          <p className="text-red-600 dark:text-red-300 font-medium">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
            Retour au Dashboard
          </Button>
        </Card>
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
                Gestion des utilisateurs
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Gérez les comptes utilisateurs et leurs permissions ({users.length} utilisateurs)
              </p>
            </div>
            <Button
              onClick={handleCreateUser}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              + Nouvel utilisateur
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/50 dark:bg-gray-700/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                {["all", "admin", "staff", "client"].map((role) => (
                  <Button
                    key={role}
                    variant={filterRole === role ? "default" : "outline"}
                    onClick={() => setFilterRole(role)}
                    className={filterRole === role ? "bg-gradient-to-r from-red-600 to-rose-600" : ""}
                    size="sm"
                  >
                    {role === "all" ? "Tous rôles" : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                {["all", "active", "inactive"].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    onClick={() => setFilterStatus(status)}
                    className={filterStatus === status ? "bg-gradient-to-r from-red-600 to-rose-600" : ""}
                    size="sm"
                  >
                    {status === "all" ? "Tous statuts" : status === "active" ? "Actifs" : "Inactifs"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("activate")}
                    className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    Activer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("deactivate")}
                    className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    Désactiver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("delete")}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Users Table/Grid */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Checkbox
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sélectionner tout ({filteredUsers.length})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 pt-0">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="p-6 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/40 dark:border-gray-600/40"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className={`${getRoleColor(user.role)} text-white font-semibold`}>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }
                  >
                    {user.status === "active" ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Rôle:</span>
                    <Badge className={getRoleBadgeColor(user.role)}>{user.role.toUpperCase()}</Badge>
                  </div>
                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Téléphone:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Inscrit:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(user.joinDate).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Dernière activité:</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{user.lastActive}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent"
                    onClick={() => handleEditUser(user)}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
                    onClick={() => handleDeleteUser(user)}
                  >
                    Supprimer
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Aucun utilisateur trouvé</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        mode={modalMode}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        user={selectedUser}
      />
    </div>
  )
}
