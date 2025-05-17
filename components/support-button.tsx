"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SupportButtonProps {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function SupportButton({ variant = "outline", size = "default", className = "" }: SupportButtonProps) {
  const handleSupport = () => {
    window.open("https://saweria.co/lolikgiovi", "_blank", "noopener,noreferrer")
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleSupport}
            className={`text-pink-500 border-pink-200 hover:bg-pink-50 hover:text-pink-600 ${className}`}
          >
            <Heart className="mr-2 h-4 w-4 fill-pink-500" />
            Support Me
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Support the developer with Saweria</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
