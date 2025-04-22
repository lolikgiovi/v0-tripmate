import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

export function getTrips(): any[] {
  if (typeof window === "undefined") return []
  const trips = localStorage.getItem("trips")
  return trips ? JSON.parse(trips) : []
}

export function saveTrips(trips: any[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem("trips", JSON.stringify(trips))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Update the currency functions in utils.ts
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

// Format currency for display based on user preference
export function formatCurrency(amount: number): string {
  const currency = getCurrencyPreference()
  const convertedAmount = amount * exchangeRates[currency as keyof typeof exchangeRates]

  if (currency === "IDR") {
    return `Rp ${Math.round(convertedAmount).toLocaleString()}`
  }

  return `$${convertedAmount.toFixed(2)}`
}

// Convert amount from display currency to USD (for storage)
export function convertToUSD(amount: number): number {
  const currency = getCurrencyPreference()
  if (currency === "USD") return amount

  return amount / exchangeRates[currency as keyof typeof exchangeRates]
}

// Convert amount from USD to display currency (for input fields)
export function convertFromUSD(amount: number): number {
  const currency = getCurrencyPreference()
  if (currency === "USD") return amount

  return amount * exchangeRates[currency as keyof typeof exchangeRates]
}

// Get currency symbol for the current preference
export function getCurrencySymbol(): string {
  const currency = getCurrencyPreference()
  return currency === "IDR" ? "Rp" : "$"
}
