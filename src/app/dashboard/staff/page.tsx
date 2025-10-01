"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RoleBasedNavigation } from "@/components/navigation/role-nav"
import { StaffModal } from "@/components/staff-management/staff-modal"
import { DeleteStaffModal } from "@/components/staff-management/delete-staff-modal"

// Interface for a staff member profile
interface StaffProfile {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffProfile | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const router = useRouter()

  const fetchStaff = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/staff")
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les données du personnel.")
      }
      setStaff(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Ensure only admins can access this page
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchStaff()
  }, [router])

  const handleCreateStaff = () => {
    setSelectedStaffMember(null)
    setModalMode("create")
    setIsStaffModalOpen(true)
  }

  const handleEditStaff = (member: StaffProfile) => {
    setSelectedStaffMember(member)
    setModalMode("edit")
    setIsStaffModalOpen(true)
  }

  const handleDeleteStaff = (member: StaffProfile) => {
    setSelectedStaffMember(member)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
      if (!selectedStaffMember) return;

      const response = await fetch(`/api/staff/${selectedStaffMember.id}`, {
          method: 'DELETE',
      });

      if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete staff member.');
      }

      fetchStaff(); // Refetch data
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Chargement du personnel...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center bg-white dark:bg-gray-800 border-red-200 dark:border-red-800 shadow-2xl">
          <div className="text-5xl mb-4">🚨</div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Erreur de chargement</h2>
          <p className="text-red-600 dark:text-red-300 font-medium">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <RoleBasedNavigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
                Gestion du Personnel
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Gérez les profils et les informations des membres de votre équipe ({staff.length} membres).
              </p>
            </div>
            <Button
              onClick={handleCreateStaff}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg"
            >
              + Nouveau Membre
            </Button>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <Card key={member.id} className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold">
                    {member.first_name[0]}{member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{member.first_name} {member.last_name}</h3>
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{member.position}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Statut:</strong> <Badge>{member.status}</Badge></p>
                <p><strong>Téléphone:</strong> {member.phone || 'N/A'}</p>
                <p><strong>Adresse:</strong> {member.address || 'N/A'}</p>
                <p><strong>Embauché le:</strong> {new Date(member.hire_date).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditStaff(member)}>Modifier</Button>
                <Button variant="outline" size="sm" className="w-full text-red-600 hover:bg-red-50" onClick={() => handleDeleteStaff(member)}>Supprimer</Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Modals */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSave={fetchStaff} // Refetch data on save
        staffMember={selectedStaffMember}
        mode={modalMode}
      />
      <DeleteStaffModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        staffMember={selectedStaffMember}
      />
    </div>
  );
}