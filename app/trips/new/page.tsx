"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Plus, X } from "lucide-react"
import type { Trip } from "@/lib/types"
import { generateId, getTrips, saveTrips } from "@/lib/utils"

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

  const addDestination = () => {
    if (newDestination.trim() !== "") {
      setDestinations([...destinations, newDestination.trim()])
      setNewDestination("")
    }
  }

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index))
  }

  const addTraveler = () => {
    if (newTraveler.trim() !== "") {
      setTravelers([...travelers, newTraveler.trim()])
      setNewTraveler("")
    }
  }

  const removeTraveler = (index: number) => {
    setTravelers(travelers.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !startDate || !endDate || destinations.length === 0 || travelers.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    const newTrip: Trip = {
      id: generateId(),
      name,
      description,
      startDate,
      endDate,
      budget: Number.parseFloat(budget) || 0,
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

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
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
