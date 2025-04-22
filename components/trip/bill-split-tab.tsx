"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ArrowRight, RefreshCw } from "lucide-react"
import type { Trip } from "@/lib/types"
import { EmptyState } from "@/components/empty-state"
import { formatCurrency } from "@/lib/utils"

interface BillSplitTabProps {
  trip: Trip
}

interface Settlement {
  from: string
  to: string
  amount: number
}

export function BillSplitTab({ trip }: BillSplitTabProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([])

  useEffect(() => {
    calculateSettlements()
  }, [trip.expenses])

  // Replace the calculateSettlements function with this updated version
  const calculateSettlements = () => {
    if (trip.expenses.length === 0) {
      setSettlements([])
      return
    }

    // Calculate how much each person paid and owes
    const paid: Record<string, number> = {}
    const owes: Record<string, number> = {}

    // Initialize with zero values
    trip.travelers.forEach((traveler) => {
      paid[traveler] = 0
      owes[traveler] = 0
    })

    // Calculate what each person paid
    trip.expenses.forEach((expense) => {
      paid[expense.paidBy] = (paid[expense.paidBy] || 0) + expense.amount
    })

    // Calculate what each person owes based on participation
    trip.expenses.forEach((expense) => {
      const participants = expense.participants || trip.travelers
      const sharePerPerson = expense.amount / participants.length

      participants.forEach((participant) => {
        owes[participant] = (owes[participant] || 0) + sharePerPerson
      })
    })

    // Calculate net balances (positive means they are owed money)
    const balances: Record<string, number> = {}
    trip.travelers.forEach((traveler) => {
      balances[traveler] = paid[traveler] - owes[traveler]
    })

    // Calculate settlements
    const newSettlements: Settlement[] = []

    // Create a copy of balances that we can modify
    const remainingBalances = { ...balances }

    // Sort travelers by balance (ascending)
    const sortedTravelers = trip.travelers.slice().sort((a, b) => remainingBalances[a] - remainingBalances[b])

    let i = 0 // index of person who owes money (negative balance)
    let j = sortedTravelers.length - 1 // index of person who is owed money (positive balance)

    // Continue until all balances are settled (or close enough to zero)
    while (i < j) {
      const debtor = sortedTravelers[i]
      const creditor = sortedTravelers[j]

      // Skip if balance is already settled
      if (Math.abs(remainingBalances[debtor]) < 0.01) {
        i++
        continue
      }

      if (Math.abs(remainingBalances[creditor]) < 0.01) {
        j--
        continue
      }

      // Calculate the amount to transfer
      const amount = Math.min(Math.abs(remainingBalances[debtor]), remainingBalances[creditor])

      // Only create a settlement if the amount is significant
      if (amount >= 0.01) {
        newSettlements.push({
          from: debtor,
          to: creditor,
          amount: Number.parseFloat(amount.toFixed(2)),
        })

        // Update remaining balances
        remainingBalances[debtor] += amount
        remainingBalances[creditor] -= amount
      }

      // Move to next person if balance is settled
      if (Math.abs(remainingBalances[debtor]) < 0.01) {
        i++
      }

      if (Math.abs(remainingBalances[creditor]) < 0.01) {
        j--
      }
    }

    setSettlements(newSettlements)
  }

  // Calculate how much each person paid
  const expensesByTraveler: Record<string, number> = {}
  trip.travelers.forEach((traveler) => {
    expensesByTraveler[traveler] = 0
  })

  trip.expenses.forEach((expense) => {
    expensesByTraveler[expense.paidBy] = (expensesByTraveler[expense.paidBy] || 0) + expense.amount
  })

  // Calculate total expenses
  const totalExpenses = Object.values(expensesByTraveler).reduce((sum, amount) => sum + amount, 0)

  // Calculate fair share
  const fairShare = totalExpenses / trip.travelers.length

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Bill Splitting</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={calculateSettlements}
          className="text-emerald-500 border-emerald-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Recalculate
        </Button>
      </div>

      {trip.expenses.length === 0 ? (
        <EmptyState
          title="No expenses to split"
          description="Add expenses to calculate how to split the bill"
          action={
            <Button onClick={() => {}} className="bg-emerald-500 hover:bg-emerald-600" disabled>
              <DollarSign className="mr-2 h-4 w-4" /> Add Expenses First
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">Total Trip Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">Fair Share Per Person</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(fairShare)}</p>
                <p className="text-sm text-muted-foreground">{trip.travelers.length} travelers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">Settlements Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{settlements.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Update the "Who Paid What" card to show both paid and owed amounts */}
          <Card>
            <CardHeader>
              <CardTitle>Who Paid What</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trip.travelers.map((traveler) => {
                  // Calculate what each person paid
                  const paid = trip.expenses
                    .filter((expense) => expense.paidBy === traveler)
                    .reduce((sum, expense) => sum + expense.amount, 0)

                  // Calculate what each person owes based on participation
                  const owes = trip.expenses
                    .filter((expense) => expense.participants?.includes(traveler) || (!expense.participants && true)) // If no participants specified, include all
                    .reduce((sum, expense) => {
                      const participants = expense.participants || trip.travelers
                      return sum + expense.amount / participants.length
                    }, 0)

                  const diff = paid - owes

                  return (
                    <div key={traveler} className="flex items-center justify-between">
                      <div className="font-medium">{traveler}</div>
                      <div className="flex items-center gap-2">
                        <span>Paid: {formatCurrency(paid)}</span>
                        <span className="text-muted-foreground">|</span>
                        <span>Owes: {formatCurrency(owes)}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className={diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : ""}>
                          {diff > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(diff))}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <p className="text-muted-foreground">Everyone has paid their fair share!</p>
              ) : (
                <div className="space-y-4">
                  {settlements.map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="font-medium">{settlement.from}</div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-emerald-500" />
                        <span className="font-bold">{formatCurrency(settlement.amount)}</span>
                        <ArrowRight className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="font-medium">{settlement.to}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
