"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ArrowRight, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import type { Trip, Expense } from "@/lib/types"
import { EmptyState } from "@/components/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { useMobile } from "@/hooks/use-mobile"
import { SupportButton } from "@/components/support-button"

interface BillSplitTabProps {
  trip: Trip
}

interface Settlement {
  from: string
  to: string
  amount: number
}

interface TravelerExpenseDetail {
  expense: Expense
  share: number
  isPayer: boolean
  paymentAmount: number
}

interface TravelerBillDetails {
  name: string
  totalPaid: number
  totalOwed: number
  balance: number
  expenseDetails: TravelerExpenseDetail[]
}

export function BillSplitTab({ trip }: BillSplitTabProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [billDetails, setBillDetails] = useState<TravelerBillDetails[]>([])
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const isMobile = useMobile()

  useEffect(() => {
    calculateSettlements()
    calculateBillDetails()
  }, [trip.expenses])

  // Calculate detailed bill information for each traveler
  const calculateBillDetails = () => {
    const details: TravelerBillDetails[] = trip.travelers.map((traveler) => {
      // Initialize the traveler's bill details
      const travelerDetails: TravelerBillDetails = {
        name: traveler,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0,
        expenseDetails: [],
      }

      // Calculate what this traveler paid and what they owe for each expense
      trip.expenses.forEach((expense) => {
        // Check if this traveler is a participant in this expense
        const isParticipant = expense.participants?.includes(traveler) || (!expense.participants && true) // If no participants specified, include all

        // Calculate this traveler's share of this expense
        const participants = expense.participants || trip.travelers
        const share = isParticipant ? expense.amount / participants.length : 0

        // Check if this traveler paid for this expense
        const payerInfo = expense.payers.find((payer) => payer.name === traveler)
        const isPayer = !!payerInfo
        const paymentAmount = payerInfo ? payerInfo.amount : 0

        // Add to totals
        travelerDetails.totalPaid += paymentAmount
        travelerDetails.totalOwed += share

        // Only add to expense details if they're involved (either paid or participated)
        if (isParticipant || isPayer) {
          travelerDetails.expenseDetails.push({
            expense,
            share,
            isPayer,
            paymentAmount,
          })
        }
      })

      // Calculate balance (positive means they are owed money)
      travelerDetails.balance = travelerDetails.totalPaid - travelerDetails.totalOwed

      return travelerDetails
    })

    // Sort by name
    details.sort((a, b) => a.name.localeCompare(b.name))

    setBillDetails(details)
  }

  // Fix the settlement calculation to ensure exact shares
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

    // Calculate what each person paid - now using payers array
    trip.expenses.forEach((expense) => {
      expense.payers.forEach((payer) => {
        paid[payer.name] = (paid[payer.name] || 0) + payer.amount
      })
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

      // Calculate the amount to transfer - use Math.min to get the exact amount
      const amount = Math.min(Math.abs(remainingBalances[debtor]), remainingBalances[creditor])

      // Only create a settlement if the amount is significant
      if (amount >= 0.01) {
        newSettlements.push({
          from: debtor,
          to: creditor,
          // Don't round the amount - keep it exact to avoid discrepancies
          amount: amount,
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

  // Calculate how much each person paid - updated for multiple payers
  const expensesByTraveler: Record<string, number> = {}
  trip.travelers.forEach((traveler) => {
    expensesByTraveler[traveler] = 0
  })

  trip.expenses.forEach((expense) => {
    expense.payers.forEach((payer) => {
      expensesByTraveler[payer.name] = (expensesByTraveler[payer.name] || 0) + payer.amount
    })
  })

  // Calculate total expenses
  const totalExpenses = Object.values(expensesByTraveler).reduce((sum, amount) => sum + amount, 0)

  // Calculate fair share
  const fairShare = totalExpenses / trip.travelers.length

  // Toggle expense details on mobile
  const toggleExpenseDetails = (expenseId: string) => {
    if (expandedExpense === expenseId) {
      setExpandedExpense(null)
    } else {
      setExpandedExpense(expenseId)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Bill Splitting</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              calculateSettlements()
              calculateBillDetails()
            }}
            className="text-emerald-500 border-emerald-500"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Recalculate
          </Button>
        </div>
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
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trip.travelers.map((traveler) => {
                  // Calculate what each person paid - updated for multiple payers
                  const paid = trip.expenses
                    .flatMap((expense) => expense.payers)
                    .filter((payer) => payer.name === traveler)
                    .reduce((sum, payer) => sum + payer.amount, 0)

                  // Calculate what each person owes based on participation
                  const owes = trip.expenses
                    .filter((expense) => expense.participants?.includes(traveler) || (!expense.participants && true)) // If no participants specified, include all
                    .reduce((sum, expense) => {
                      const participants = expense.participants || trip.travelers
                      return sum + expense.amount / participants.length
                    }, 0)

                  const diff = paid - owes

                  return (
                    <div key={traveler} className={isMobile ? "space-y-1" : "flex items-center justify-between"}>
                      <div className="font-medium">{traveler}</div>
                      {isMobile ? (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Paid:</span>
                            <div>{formatCurrency(paid)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Owes:</span>
                            <div>{formatCurrency(owes)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <div className={diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : ""}>
                              {diff > 0 ? "+" : ""}
                              {formatCurrency(Math.abs(diff))}
                            </div>
                          </div>
                        </div>
                      ) : (
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
                      )}
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
                    <div
                      key={index}
                      className={
                        isMobile
                          ? "p-3 border rounded-lg space-y-2"
                          : "flex items-center justify-between p-3 border rounded-lg"
                      }
                    >
                      {isMobile ? (
                        <>
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{settlement.from}</div>
                            <ArrowRight className="h-4 w-4 text-emerald-500" />
                            <div className="font-medium">{settlement.to}</div>
                          </div>
                          <div className="text-center font-bold">{formatCurrency(settlement.amount)}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium">{settlement.from}</div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-emerald-500" />
                            <span className="font-bold">{formatCurrency(settlement.amount)}</span>
                            <ArrowRight className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="font-medium">{settlement.to}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Bill Details Section - Mobile Optimized */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {billDetails.map((travelerDetail, index) => (
                  <AccordionItem key={index} value={`traveler-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div
                        className={
                          isMobile ? "text-left space-y-1 w-full" : "flex justify-between items-center w-full pr-4"
                        }
                      >
                        <div className="font-medium">{travelerDetail.name}</div>
                        {isMobile ? (
                          <div className="flex justify-between text-sm">
                            <Badge
                              variant="outline"
                              className={
                                travelerDetail.balance > 0
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : travelerDetail.balance < 0
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : ""
                              }
                            >
                              Balance: {travelerDetail.balance > 0 ? "+" : ""}
                              {formatCurrency(Math.abs(travelerDetail.balance))}
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <span>Paid: {formatCurrency(travelerDetail.totalPaid)}</span>
                            <span>Owes: {formatCurrency(travelerDetail.totalOwed)}</span>
                            <span
                              className={
                                travelerDetail.balance > 0
                                  ? "text-emerald-500 font-medium"
                                  : travelerDetail.balance < 0
                                    ? "text-red-500 font-medium"
                                    : ""
                              }
                            >
                              Balance: {travelerDetail.balance > 0 ? "+" : ""}
                              {formatCurrency(Math.abs(travelerDetail.balance))}
                            </span>
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {isMobile ? (
                        // Mobile view - card-based layout
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-muted rounded-md">
                              <div className="text-muted-foreground">Total Paid</div>
                              <div className="font-medium">{formatCurrency(travelerDetail.totalPaid)}</div>
                            </div>
                            <div className="p-2 bg-muted rounded-md">
                              <div className="text-muted-foreground">Total Owed</div>
                              <div className="font-medium">{formatCurrency(travelerDetail.totalOwed)}</div>
                            </div>
                          </div>

                          <div className="text-sm font-medium">Expense Breakdown</div>
                          {travelerDetail.expenseDetails.map((detail, i) => {
                            const net = detail.paymentAmount - detail.share
                            const expenseId = `${travelerDetail.name}-${detail.expense.id}`
                            const isExpanded = expandedExpense === expenseId

                            return (
                              <Card key={i} className="border shadow-none">
                                <CardContent className="p-3 space-y-2">
                                  <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => toggleExpenseDetails(expenseId)}
                                  >
                                    <div>
                                      <div className="font-medium">{detail.expense.title}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatDate(detail.expense.date)}
                                        {detail.expense.category && ` • ${detail.expense.category}`}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={
                                          net > 0
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : net < 0
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : ""
                                        }
                                      >
                                        {net > 0 ? "+" : ""}
                                        {formatCurrency(Math.abs(net))}
                                      </Badge>
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="pt-2 space-y-2 border-t mt-2">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <div className="text-xs text-muted-foreground">Total Amount</div>
                                          <div>{formatCurrency(detail.expense.amount)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-muted-foreground">Your Share</div>
                                          <div>{formatCurrency(detail.share)}</div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <div className="text-xs text-muted-foreground">You Paid</div>
                                          <div>{detail.isPayer ? formatCurrency(detail.paymentAmount) : "Nothing"}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-muted-foreground">Net</div>
                                          <div className={net > 0 ? "text-emerald-500" : net < 0 ? "text-red-500" : ""}>
                                            {net > 0 ? "+" : ""}
                                            {formatCurrency(Math.abs(net))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}

                          {/* Summary card */}
                          <Card className="border bg-muted/30">
                            <CardContent className="p-3">
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <div className="text-xs text-muted-foreground">Total Owed</div>
                                  <div className="font-medium">{formatCurrency(travelerDetail.totalOwed)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Total Paid</div>
                                  <div className="font-medium">{formatCurrency(travelerDetail.totalPaid)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Balance</div>
                                  <div
                                    className={`font-medium ${
                                      travelerDetail.balance > 0
                                        ? "text-emerald-500"
                                        : travelerDetail.balance < 0
                                          ? "text-red-500"
                                          : ""
                                    }`}
                                  >
                                    {travelerDetail.balance > 0 ? "+" : ""}
                                    {formatCurrency(Math.abs(travelerDetail.balance))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        // Desktop view - table layout
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableCaption>Expense breakdown for {travelerDetail.name}</TableCaption>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Expense</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Share</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {travelerDetail.expenseDetails.map((detail, i) => {
                                const net = detail.paymentAmount - detail.share
                                return (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">
                                      {detail.expense.title}
                                      {detail.expense.category && (
                                        <span className="text-xs text-muted-foreground block">
                                          {detail.expense.category}
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>{formatDate(detail.expense.date)}</TableCell>
                                    <TableCell>{formatCurrency(detail.expense.amount)}</TableCell>
                                    <TableCell>{formatCurrency(detail.share)}</TableCell>
                                    <TableCell>{detail.isPayer ? formatCurrency(detail.paymentAmount) : "-"}</TableCell>
                                    <TableCell className="text-right">
                                      <span className={net > 0 ? "text-emerald-500" : net < 0 ? "text-red-500" : ""}>
                                        {net > 0 ? "+" : ""}
                                        {formatCurrency(Math.abs(net))}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              {/* Summary row */}
                              <TableRow className="bg-muted/50">
                                <TableCell colSpan={3} className="font-medium">
                                  Total
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(travelerDetail.totalOwed)}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(travelerDetail.totalPaid)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  <span
                                    className={
                                      travelerDetail.balance > 0
                                        ? "text-emerald-500"
                                        : travelerDetail.balance < 0
                                          ? "text-red-500"
                                          : ""
                                    }
                                  >
                                    {travelerDetail.balance > 0 ? "+" : ""}
                                    {formatCurrency(Math.abs(travelerDetail.balance))}
                                  </span>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 bg-pink-50 rounded-lg border border-pink-100 text-center">
            <p className="text-sm text-pink-700 mb-2">
              Kebantu proses split bill? Bolelaa support yg bikin
            </p>
            <SupportButton variant="default" className="bg-pink-500 hover:bg-pink-600 text-white border-none" />
          </div>
        </div>
      )}
    </div>
  )
}
