"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface MobileNavProps {
  navItems: string[]
  activeItem: string
  onItemClick: (item: string) => void
}

export function MobileNav({ navItems, activeItem, onItemClick }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <div className="flex flex-col gap-1">
            <div className="w-5 h-0.5 bg-current"></div>
            <div className="w-5 h-0.5 bg-current"></div>
            <div className="w-5 h-0.5 bg-current"></div>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🗑️</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            WasteManager
          </h2>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item}
              variant={item === activeItem ? "default" : "ghost"}
              className={`w-full justify-start ${
                item === activeItem
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white"
                  : "hover:bg-red-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => {
                onItemClick(item)
                setIsOpen(false)
              }}
            >
              {item}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
