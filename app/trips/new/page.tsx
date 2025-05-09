"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Plus, X } from "lucide-react"
import type { Trip } from "@/lib/types"
import { generateId, getTrips, saveTrips, getCurrencySymbol } from "@/lib/utils"

export default function NewTrip() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState("")
  const [destinations, setDestinations] = useState<string[]>([])
  const [newDestination, setNewDestination] = useState("")
  const [travelers, setTravelers] = useState<string[]>([])
  const [newTraveler, setNewTraveler] = useState("")
  const [currencySymbol, setCurrencySymbol] = useState("Rp")

  // Get the currency symbol when component mounts
  useEffect(() => {
    setCurrencySymbol(getCurrencySymbol())
  }, [])

  // Update the addDestination function to check for unique destinations
  const addDestination = () => {
    const trimmedDestination = newDestination.trim()
    if (trimmedDestination !== "") {
      // Check if the destination already exists (case-insensitive)
      if (destinations.some((dest) => dest.toLowerCase() === trimmedDestination.toLowerCase())) {
        alert("This destination already exists. Please add a unique destination.")
        return
      }
      setDestinations([...destinations, trimmedDestination])
      setNewDestination("")
      // Don't blur the input to keep keyboard visible
    }
  }

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index))
  }

  const addTraveler = () => {
    const trimmedName = newTraveler.trim()
    if (trimmedName !== "") {
      // Check if the name already exists (case-insensitive)
      if (travelers.some((traveler) => traveler.toLowerCase() === trimmedName.toLowerCase())) {
        alert("This traveler name already exists. Please use a unique name.")
        return
      }
      setTravelers([...travelers, trimmedName])
      setNewTraveler("")
      // Don't blur the input to keep keyboard visible
    }
  }

  const removeTraveler = (index: number) => {
    setTravelers(travelers.filter((_, i) => i !== index))
  }

  // Add a new function to format the budget input with thousands separators for IDR
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters
    const numericValue = e.target.value.replace(/[^\d]/g, "")

    if (numericValue === "") {
      setBudget("")
      return
    }

    const numberValue = Number.parseInt(numericValue, 10)

    // Format differently based on currency
    if (currencySymbol === "Rp") {
      // For IDR: no decimal places, use dot as thousands separator
      const formatted = numberValue.toLocaleString("id-ID").replace(/,/g, ".")
      setBudget(formatted)
    } else {
      // For USD: keep decimal places
      setBudget(numberValue.toString())
    }
  }

  // Update the handleSubmit function to correctly handle budget conversion
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !startDate || !endDate || destinations.length === 0 || travelers.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    // Parse the budget value correctly based on the format
    let budgetValue = 0
    if (budget) {
      if (currencySymbol === "Rp") {
        // For IDR: remove all dots and parse as integer
        budgetValue = Number.parseInt(budget.replace(/\./g, ""), 10)
        // IMPORTANT: Don't convert to USD here, as the Trip object should store the value in the original currency
      } else {
        // For USD: parse as float
        budgetValue = Number.parseFloat(budget)
      }
    }

    const newTrip: Trip = {
      id: generateId(),
      name,
      description,
      startDate,
      endDate,
      budget: budgetValue || 0,
      destinations,
      travelers,
      agenda: [],
      expenses: [],
    }

    const trips = getTrips()
    saveTrips([...trips, newTrip])
    router.push("/")
  }

  return (
    <main className="container max-w-2xl mx-auto px-4 py-6">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Trip</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Trip Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summer Vacation 2023"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your trip"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            {/* Update the budget input field to use the new handler */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ({currencySymbol})</Label>
              <Input id="budget" value={budget} onChange={handleBudgetChange} placeholder="0" className="text-right" />
            </div>

            <div className="space-y-2">
              <Label>Destinations *</Label>
              <div className="flex space-x-2">
                <Input
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  placeholder="Add a destination"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addDestination()
                    }
                  }}
                />
                <Button type="button" onClick={addDestination} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {destinations.map((destination, index) => (
                  <div key={index} className="flex items-center bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    {destination}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1"
                      onClick={() => removeDestination(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Travelers *</Label>
              <div className="flex space-x-2">
                <Input
                  value={newTraveler}
                  onChange={(e) => setNewTraveler(e.target.value)}
                  placeholder="Add a traveler"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTraveler()
                    }
                  }}
                />
                <Button type="button" onClick={addTraveler} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {travelers.map((traveler, index) => (
                  <div key={index} className="flex items-center bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    {traveler}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1"
                      onClick={() => removeTraveler(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">
              Create Trip
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
