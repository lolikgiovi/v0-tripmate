import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Trip } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  return new Date(dateString).toLocaleDateString("en-US", options)
}

// Local storage functions
export function getTrips(): Trip[] {
  if (typeof window === "undefined") return []

  const tripsJson = localStorage.getItem("trips")
  if (!tripsJson) return []

  try {
    return JSON.parse(tripsJson)
  } catch (error) {
    console.error("Error parsing trips from localStorage", error)
    return []
  }
}

export function saveTrips(trips: Trip[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("trips", JSON.stringify(trips))
  } catch (error) {
    console.error("Error saving trips to localStorage", error)
  }
}
