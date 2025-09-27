"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Activity {
  id: string
  action: string
  time: string
  status: "En attente" | "En cours" | "Terminé" | "Urgent"
  user?: string
  location?: string
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getStatusColor = (status: Activity["status"]) => {
    switch (status) {
      case "En attente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "En cours":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "Terminé":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: Activity["status"]) => {
    switch (status) {
      case "En attente":
        return "⏳"
      case "En cours":
        return "🔄"
      case "Terminé":
        return "✅"
      case "Urgent":
        return "🚨"
      default:
        return "📋"
    }
  }

  return (
    <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
          Activité récente
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">En temps réel</span>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="group relative flex items-start gap-4 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Timeline dot */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg group-hover:scale-125 transition-transform duration-300"></div>
              {index < activities.length - 1 && (
                <div className="w-px h-8 bg-gradient-to-b from-red-200 to-transparent dark:from-red-800 ml-1.5 mt-2"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                    {activity.action}
                  </p>
                  {activity.user && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Par: <span className="font-medium">{activity.user}</span>
                    </p>
                  )}
                  {activity.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {activity.location}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{activity.time}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(activity.status)}</span>
                  <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
