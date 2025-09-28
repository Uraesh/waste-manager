export interface StaffProfileType {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  hireDate: string;
  status: string;
  avatar: string;
  skills: string[];
  certifications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  performance: {
    rating: number;
    completedMissions: number;
    averageRating: number;
    lastReviewDate: string;
  };
}