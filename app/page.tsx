"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, MapPin, Calendar, DollarSign, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Trip } from "@/lib/types"
import { formatDate, getTrips, saveTrips } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"
import { InstallPWA } from "@/components/install-pwa"

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setTrips(getTrips())
    setIsLoading(false)
  }, [])

  const deleteTrip = (id: string) => {
    const updatedTrips = trips.filter((trip) => trip.id !== id)
    setTrips(updatedTrips)
    saveTrips(updatedTrips)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">TripMate</h1>
        <InstallPWA />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your Trips</h2>
        <Button onClick={() => router.push("/trips/new")} className="bg-emerald-500 hover:bg-emerald-600">
          <PlusCircle className="mr-2 h-4 w-4" /> New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <EmptyState
          title="No trips yet"
          description="Create your first trip to get started"
          action={
            <Button onClick={() => router.push("/trips/new")} className="bg-emerald-500 hover:bg-emerald-600">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Trip
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden border-2 hover:border-emerald-500 transition-all">
              <Link href={`/trips/${trip.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{trip.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" /> {trip.destinations.join(", ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col space-y-1 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{trip.travelers.length} travelers</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>
                        Budget: ${trip.budget.toFixed(2)} • Spent: $
                        {trip.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
              <CardFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.preventDefault()
                    if (confirm("Are you sure you want to delete this trip?")) {
                      deleteTrip(trip.id)
                    }
                  }}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
