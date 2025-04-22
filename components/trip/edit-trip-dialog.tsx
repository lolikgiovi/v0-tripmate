"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Plus, X, AlertTriangle } from "lucide-react"
import type { Trip } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EditTripDialogProps {
  trip: Trip
  updateTrip: (trip: Trip) => void
}

export function EditTripDialog({ trip, updateTrip }: EditTripDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(trip.name)
  const [description, setDescription] = useState(trip.description)
  const [startDate, setStartDate] = useState(trip.startDate)
  const [endDate, setEndDate] = useState(trip.endDate)
  const [budget, setBudget] = useState(trip.budget.toString())
  const [destinations, setDestinations] = useState<string[]>([...trip.destinations])
  const [newDestination, setNewDestination] = useState("")
  const [travelers, setTravelers] = useState<string[]>([...trip.travelers])
  const [newTraveler, setNewTraveler] = useState("")
  const [removedTravelers, setRemovedTravelers] = useState<string[]>([])
  const [dateWarning, setDateWarning] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(trip.name)
      setDescription(trip.description)
      setStartDate(trip.startDate)
      setEndDate(trip.endDate)
      setBudget(trip.budget.toString())
      setDestinations([...trip.destinations])
      setTravelers([...trip.travelers])
      setRemovedTravelers([])
      setDateWarning(false)
    }
  }, [isOpen, trip])

  // Check for date changes that might affect agenda items
  useEffect(() => {
    const originalStart = new Date(trip.startDate)
    const originalEnd = new Date(trip.endDate)
    const newStart = new Date(startDate)
    const newEnd = new Date(endDate)

    // Check if new date range is smaller than original
    if (newStart > originalStart || newEnd < originalEnd) {
      // Check if any agenda items would be outside the new range
      const hasOutOfRangeItems = trip.agenda.some((item) => {
        const itemDate = new Date(item.date)
        return itemDate < newStart || itemDate > newEnd
      })

      // Check if any expenses would be outside the new range
      const hasOutOfRangeExpenses = trip.expenses.some((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate < newStart || expenseDate > newEnd
      })

      setDateWarning(hasOutOfRangeItems || hasOutOfRangeExpenses)
    } else {
      setDateWarning(false)
    }
  }, [startDate, endDate, trip])

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
    if (newTraveler.trim() !== "" && !travelers.includes(newTraveler.trim())) {
      setTravelers([...travelers, newTraveler.trim()])
      setNewTraveler("")
    }
  }

  const removeTraveler = (index: number) => {
    const travelerToRemove = travelers[index]
    setRemovedTravelers([...removedTravelers, travelerToRemove])
    setTravelers(travelers.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!name || !startDate || !endDate || destinations.length === 0 || travelers.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    // Create updated trip with basic info
    const updatedTrip: Trip = {
      ...trip,
      name,
      description,
      startDate,
      endDate,
      budget: Number.parseFloat(budget) || 0,
      destinations,
      travelers,
    }

    // Handle removed travelers (cascading delete)
    if (removedTravelers.length > 0) {
      // Remove expenses paid by removed travelers
      updatedTrip.expenses = updatedTrip.expenses.filter((expense) => !removedTravelers.includes(expense.paidBy))

      // Remove removed travelers from expense participants
      updatedTrip.expenses = updatedTrip.expenses.map((expense) => ({
        ...expense,
        participants: expense.participants.filter((participant) => !removedTravelers.includes(participant)),
      }))

      // If an expense has no participants left, remove it
      updatedTrip.expenses = updatedTrip.expenses.filter((expense) => expense.participants.length > 0)
    }

    // Handle date changes (cascading update)
    const newStartDate = new Date(startDate)
    const newEndDate = new Date(endDate)

    // Filter out agenda items outside the new date range
    updatedTrip.agenda = updatedTrip.agenda.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= newStartDate && itemDate <= newEndDate
    })

    // Filter out expenses outside the new date range
    updatedTrip.expenses = updatedTrip.expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= newStartDate && expenseDate <= newEndDate
    })

    updateTrip(updatedTrip)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-1">
          <Edit className="h-4 w-4" /> Edit Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
          <DialogDescription>Update your trip details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {dateWarning && (
            <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Changing the date range will remove agenda items and expenses that fall outside the new dates.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Trip Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
