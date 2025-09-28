"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface KPICardProps {
  title: string
  value: string | number
  icon: string
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
}

export function KPICard({ title, value, icon, color, trend, subtitle }: KPICardProps) {
  return (
    <Card
      className={`group p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-l-4 ${color} hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
              {value}
            </p>
            {trend && (
              <Badge
                variant="secondary"
                className={`text-xs ${
                  trend.isPositive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="ml-4">
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300 inline-block">{icon}</span>
        </div>
      </div>
    </Card>
  )
}
