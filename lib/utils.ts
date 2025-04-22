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

// Currency functions
export function getCurrencyPreference(): string {
  if (typeof window === "undefined") return "USD"
  return localStorage.getItem("currencyPreference") || "USD"
}

export function setCurrencyPreference(currency: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("currencyPreference", currency)
}

// Exchange rates (simplified - in a real app, you would use an API)
const exchangeRates = {
  USD: 1,
  IDR: 15500, // 1 USD = 15500 IDR (approximate)
}

export function formatCurrency(amount: number): string {
  const currency = getCurrencyPreference()
  const convertedAmount = amount * exchangeRates[currency as keyof typeof exchangeRates]

  if (currency === "IDR") {
    return `Rp ${Math.round(convertedAmount).toLocaleString()}`
  }

  return `$${convertedAmount.toFixed(2)}`
}

// Add this function to ensure backward compatibility with existing trips
export function migrateTrip(trip: any): Trip {
  // Ensure all expenses have participants
  if (trip.expenses) {
    trip.expenses = trip.expenses.map((expense: any) => {
      if (!expense.participants) {
        return {
          ...expense,
          participants: [...trip.travelers], // Default to all travelers
        }
      }
      return expense
    })
  }

  return trip as Trip
}

// Update the getTrips function to use the migration
export function getTrips(): Trip[] {
  if (typeof window === "undefined") return []

  const tripsJson = localStorage.getItem("trips")
  if (!tripsJson) return []

  try {
    const trips = JSON.parse(tripsJson)
    // Migrate each trip to ensure it has the latest structure
    return trips.map(migrateTrip)
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
