"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Calendar, MapPin, Users, DollarSign } from "lucide-react"
import type { Trip } from "@/lib/types"
import { formatDate, getTrips, saveTrips, formatCurrency } from "@/lib/utils"
import { ExpensesTab } from "@/components/trip/expenses-tab"
import { BillSplitTab } from "@/components/trip/bill-split-tab"
import { EditTripDialog } from "@/components/trip/edit-trip-dialog"

export default function TripDetails({ params }: { params: { id: string } }) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const trips = getTrips()
    const foundTrip = trips.find((t) => t.id === params.id)

    if (foundTrip) {
      setTrip(foundTrip)
    } else {
      router.push("/")
    }

    setIsLoading(false)
  }, [params.id, router])

  const updateTrip = (updatedTrip: Trip) => {
    setTrip(updatedTrip)
    const trips = getTrips()
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t))
    saveTrips(updatedTrips)
  }

  if (isLoading || !trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  const totalBudget = trip.budget
  const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const remainingBudget = totalBudget - totalSpent

  return (
    <main className="container max-w-4xl mx-auto px-4 py-6">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Trips
      </Button>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{trip.name}</CardTitle>
            <CardDescription>{trip.description}</CardDescription>
          </div>
          <EditTripDialog trip={trip} updateTrip={updateTrip} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                <span>
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
                <span>{trip.destinations.join(", ")}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-emerald-500" />
                <span>{trip.travelers.join(", ")}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                <span>Total Budget: {formatCurrency(totalBudget)}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-red-500" />
                <span>Total Spent: {formatCurrency(totalSpent)}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-blue-500" />
                <span>Remaining: {formatCurrency(remainingBudget)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="split">Bill Split</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <ExpensesTab trip={trip} updateTrip={updateTrip} />
        </TabsContent>

        <TabsContent value="split">
          <BillSplitTab trip={trip} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
