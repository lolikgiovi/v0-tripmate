"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Calendar, Clock, MapPin, Pencil, Trash2, DollarSign } from "lucide-react"
import type { AgendaItem, Trip } from "@/lib/types"
import { generateId, formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"

interface AgendaTabProps {
  trip: Trip
  updateTrip: (trip: Trip) => void
}

export function AgendaTab({ trip, updateTrip }: AgendaTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<AgendaItem | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDate("")
    setStartTime("")
    setEndTime("")
    setLocation("")
    setEstimatedCost("")
    setCurrentItem(null)
  }

  const openEditDialog = (item: AgendaItem) => {
    setCurrentItem(item)
    setTitle(item.title)
    setDescription(item.description || "")
    setDate(item.date)
    setStartTime(item.startTime || "")
    setEndTime(item.endTime || "")
    setLocation(item.location || "")
    setEstimatedCost(item.estimatedCost ? item.estimatedCost.toString() : "")
    setIsEditDialogOpen(true)
  }

  const handleAddItem = () => {
    if (!title || !date) {
      alert("Please fill in all required fields")
      return
    }

    const newItem: AgendaItem = {
      id: generateId(),
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      estimatedCost: estimatedCost ? Number.parseFloat(estimatedCost) : undefined,
    }

    const updatedTrip = {
      ...trip,
      agenda: [...trip.agenda, newItem].sort((a, b) => {
        // Sort by date first
        const dateComparison = a.date.localeCompare(b.date)
        if (dateComparison !== 0) return dateComparison

        // If same date, sort by start time
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime)
        }
        return 0
      }),
    }

    updateTrip(updatedTrip)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditItem = () => {
    if (!currentItem || !title || !date) {
      alert("Please fill in all required fields")
      return
    }

    const updatedItem: AgendaItem = {
      ...currentItem,
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      estimatedCost: estimatedCost ? Number.parseFloat(estimatedCost) : undefined,
    }

    const updatedTrip = {
      ...trip,
      agenda: trip.agenda
        .map((item) => (item.id === currentItem.id ? updatedItem : item))
        .sort((a, b) => {
          // Sort by date first
          const dateComparison = a.date.localeCompare(b.date)
          if (dateComparison !== 0) return dateComparison

          // If same date, sort by start time
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime)
          }
          return 0
        }),
    }

    updateTrip(updatedTrip)
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this agenda item?")) {
      const updatedTrip = {
        ...trip,
        agenda: trip.agenda.filter((item) => item.id !== id),
      }
      updateTrip(updatedTrip)
    }
  }

  // Group agenda items by date
  const agendaByDate = trip.agenda.reduce(
    (groups, item) => {
      const date = item.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
      return groups
    },
    {} as Record<string, AgendaItem[]>,
  )

  // Sort dates
  const sortedDates = Object.keys(agendaByDate).sort()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Trip Agenda</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Agenda Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Museum Visit"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about the activity"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={trip.startDate}
                  max={trip.endDate}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address or place name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddItem} className="bg-emerald-500 hover:bg-emerald-600">
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agenda Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={trip.startDate}
                  max={trip.endDate}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input id="edit-endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address or place name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estimatedCost">Estimated Cost ($)</Label>
                <Input
                  id="edit-estimatedCost"
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleEditItem} className="bg-emerald-500 hover:bg-emerald-600">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {trip.agenda.length === 0 ? (
        <EmptyState
          title="No agenda items yet"
          description="Start planning your trip by adding activities"
          action={
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
              <PlusCircle className="mr-2 h-4 w-4" /> Add First Item
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-2">
              <h4 className="font-medium text-emerald-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <div className="space-y-2">
                {agendaByDate[date].map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-emerald-500">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex justify-between items-start">
                        <span>{item.title}</span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4 text-sm">
                      {item.description && <p className="mb-2">{item.description}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(item.startTime || item.endTime) && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                            <span>
                              {item.startTime && item.startTime}
                              {item.startTime && item.endTime && " - "}
                              {item.endTime && item.endTime}
                            </span>
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                      {item.estimatedCost !== undefined && (
                        <div className="mt-2 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                          <span>Estimated Cost: {formatCurrency(item.estimatedCost)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
