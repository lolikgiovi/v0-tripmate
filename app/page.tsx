"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, MapPin, Calendar, DollarSign, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Trip } from "@/lib/types"
import { formatDate, getTrips, saveTrips, formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"
import { InstallPWA } from "@/components/install-pwa"
import { SettingsDialog } from "@/components/settings-dialog"
import { SupportButton } from "@/components/support-button"

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
        <h1 className="text-3xl font-bold">MainBagi</h1>
        <div className="flex items-center gap-2">
          {trips.length > 0 && <SupportButton />}
          <SettingsDialog />
          <InstallPWA />
        </div>
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
                    {trip.destinations && trip.destinations.length > 0 ? (
                      <>
                        <MapPin className="h-4 w-4 mr-1 fill-current" /> {trip.destinations.join(", ")}
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-1 stroke-current fill-none" /> No destinations
                      </>
                    )}
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
                        Budget: {formatCurrency(trip.budget)} • Spent:{" "}
                        {formatCurrency(trip.expenses.reduce((sum, exp) => sum + exp.amount, 0))}
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

      {trips.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Enjoying MainBagi? Consider supporting the developer!</p>
          <SupportButton variant="default" className="bg-pink-500 hover:bg-pink-600 text-white border-none" />
        </div>
      )}
    </main>
  )
}
