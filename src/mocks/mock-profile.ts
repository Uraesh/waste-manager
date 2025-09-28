import type { StaffProfileType } from "@/types/staff-profile"

export const mockProfile: StaffProfileType = {
  id: "staff_001",
  name: "Jean Dupont",
  email: "jean.dupont@wastemanager.com",
  phone: "+33 6 12 34 56 78",
  role: "Agent de collecte",
  department: "Collecte",
  hireDate: "2023-01-15",
  status: "active",
  avatar: "/placeholder-user.jpg",
  skills: ["Conduite", "Tri sélectif", "Maintenance véhicule"],
  certifications: ["Permis B", "CACES", "Sécurité routière"],
  emergencyContact: {
    name: "Marie Dupont",
    phone: "+33 6 98 76 54 32",
    relationship: "Épouse"
  },
  address: {
    street: "123 Rue de la Paix",
    city: "Paris",
    postalCode: "75001",
    country: "France"
  },
  preferences: {
    language: "fr",
    timezone: "Europe/Paris",
    notifications: {
      email: true,
      sms: true,
      push: false
    }
  },
  performance: {
    rating: 4.5,
    completedMissions: 127,
    averageRating: 4.3,
    lastReviewDate: "2024-01-15"
  }
}
