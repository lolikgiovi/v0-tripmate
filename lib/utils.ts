import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Trip } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Add this function to ensure backward compatibility with existing trips
export function migrateTrip(trip: any): Trip {
  // Ensure all expenses have participants
  if (trip.expenses) {
    trip.expenses = trip.expenses.map((expense: any) => {
      // Add participants if missing
      if (!expense.participants) {
        expense.participants = [...trip.travelers]
      }

      // Convert old paidBy to new payers array
      if (expense.paidBy && !expense.payers) {
        expense.payers = [
          {
            name: expense.paidBy,
            amount: expense.amount,
          },
        ]
        // Keep paidBy for backward compatibility
      }

      return expense
    })
  }

  return trip as Trip
}

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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Update the currency functions in utils.ts
export function getCurrencyPreference(): string {
  if (typeof window === "undefined") return "IDR"
  return localStorage.getItem("currencyPreference") || "IDR"
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

// Update the formatCurrency function to handle currency correctly
export function formatCurrency(amount: number): string {
  const currency = getCurrencyPreference()

  // Don't convert the amount - display it as is in the preferred currency format
  if (currency === "IDR") {
    return `Rp ${Math.round(amount).toLocaleString("id-ID").replace(/,/g, ".")}`
  }

  return `$${amount.toFixed(2)}`
}

// Remove these conversion functions as we're no longer converting between currencies for storage
// We'll keep the function signatures to avoid breaking existing code, but they'll now be identity functions

export function convertToUSD(amount: number): number {
  return amount // No conversion, return as is
}

export function convertFromUSD(amount: number): number {
  return amount // No conversion, return as is
}

// Get currency symbol for the current preference
export function getCurrencySymbol(): string {
  const currency = getCurrencyPreference()
  return currency === "IDR" ? "Rp" : "$"
}

// Add a function to format budget display with proper separators
export function formatBudgetInput(value: number, currency: string): string {
  if (currency === "IDR") {
    // For IDR: no decimal places, use dot as thousands separator
    return Math.round(value).toLocaleString("id-ID").replace(/,/g, ".")
  } else {
    // For USD: keep decimal places
    return value.toString()
  }
}
