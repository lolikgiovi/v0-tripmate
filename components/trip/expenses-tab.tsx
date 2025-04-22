"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Receipt, Calendar, DollarSign, User, Pencil, Trash2, Users } from "lucide-react"
import type { Expense, Trip } from "@/lib/types"
import { generateId, formatDate, formatCurrency, convertToUSD, convertFromUSD, getCurrencySymbol } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"

interface ExpensesTabProps {
  trip: Trip
  updateTrip: (trip: Trip) => void
}

export function ExpensesTab({ trip, updateTrip }: ExpensesTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [category, setCategory] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [notes, setNotes] = useState("")
  const [participants, setParticipants] = useState<string[]>([])
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol())

  // Update currency symbol when component mounts
  useEffect(() => {
    setCurrencySymbol(getCurrencySymbol())
  }, [])

  const resetForm = () => {
    setTitle("")
    setAmount("")
    setDate("")
    setCategory("")
    setPaidBy("")
    setParticipants([])
    setNotes("")
    setCurrentExpense(null)
  }

  const openEditDialog = (expense: Expense) => {
    setCurrentExpense(expense)
    setTitle(expense.title)
    // Convert the stored USD amount to the display currency
    setAmount(convertFromUSD(expense.amount).toString())
    setDate(expense.date)
    setCategory(expense.category || "")
    setPaidBy(expense.paidBy)
    setParticipants(expense.participants || [])
    setNotes(expense.notes || "")
    setIsEditDialogOpen(true)
  }

  const handleAddExpense = () => {
    if (!title || !amount || !date || !paidBy || participants.length === 0) {
      alert("Please fill in all required fields and select at least one participant")
      return
    }

    const newExpense: Expense = {
      id: generateId(),
      title,
      // Convert the display currency amount to USD for storage
      amount: convertToUSD(Number.parseFloat(amount)),
      date,
      category: category || undefined,
      paidBy,
      participants,
      notes: notes || undefined,
    }

    const updatedTrip = {
      ...trip,
      expenses: [...trip.expenses, newExpense].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }

    updateTrip(updatedTrip)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditExpense = () => {
    if (!currentExpense || !title || !amount || !date || !paidBy || participants.length === 0) {
      alert("Please fill in all required fields and select at least one participant")
      return
    }

    const updatedExpense: Expense = {
      ...currentExpense,
      title,
      // Convert the display currency amount to USD for storage
      amount: convertToUSD(Number.parseFloat(amount)),
      date,
      category: category || undefined,
      paidBy,
      participants,
      notes: notes || undefined,
    }

    const updatedTrip = {
      ...trip,
      expenses: trip.expenses
        .map((expense) => (expense.id === currentExpense.id ? updatedExpense : expense))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }

    updateTrip(updatedTrip)
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteExpense = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const updatedTrip = {
        ...trip,
        expenses: trip.expenses.filter((expense) => expense.id !== id),
      }
      updateTrip(updatedTrip)
    }
  }

  const toggleAllParticipants = () => {
    if (participants.length === trip.travelers.length) {
      setParticipants([])
    } else {
      setParticipants([...trip.travelers])
    }
  }

  const toggleParticipant = (traveler: string) => {
    if (participants.includes(traveler)) {
      setParticipants(participants.filter((p) => p !== traveler))
    } else {
      setParticipants([...participants, traveler])
    }
  }

  // Calculate total expenses
  const totalExpenses = trip.expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate expenses by category
  const expensesByCategory = trip.expenses.reduce(
    (categories, expense) => {
      const category = expense.category || "Uncategorized"
      if (!categories[category]) {
        categories[category] = 0
      }
      categories[category] += expense.amount
      return categories
    },
    {} as Record<string, number>,
  )

  // Calculate expenses by traveler
  const expensesByTraveler = trip.expenses.reduce(
    (travelers, expense) => {
      if (!travelers[expense.paidBy]) {
        travelers[expense.paidBy] = 0
      }
      travelers[expense.paidBy] += expense.amount
      return travelers
    },
    {} as Record<string, number>,
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Trip Expenses</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dinner"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({currencySymbol}) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Accommodation">Accommodation</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Activities">Activities</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidBy">Paid By *</Label>
                <Select value={paidBy} onValueChange={setPaidBy} required>
                  <SelectTrigger id="paidBy">
                    <SelectValue placeholder="Select a traveler" />
                  </SelectTrigger>
                  <SelectContent>
                    {trip.travelers.map((traveler) => (
                      <SelectItem key={traveler} value={traveler}>
                        {traveler}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Participants Section */}
              <div className="space-y-2">
                <Label>Participants *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant={participants.length === trip.travelers.length ? "default" : "outline"}
                      size="sm"
                      onClick={toggleAllParticipants}
                      className={
                        participants.length === trip.travelers.length ? "bg-emerald-500 hover:bg-emerald-600" : ""
                      }
                    >
                      All Travelers
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {trip.travelers.map((traveler) => (
                      <Button
                        key={traveler}
                        type="button"
                        variant={participants.includes(traveler) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleParticipant(traveler)}
                        className={participants.includes(traveler) ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                      >
                        {traveler}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details"
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
              <Button type="button" onClick={handleAddExpense} className="bg-emerald-500 hover:bg-emerald-600">
                Add Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount ({currencySymbol}) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
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

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Accommodation">Accommodation</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Activities">Activities</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-paidBy">Paid By *</Label>
                <Select value={paidBy} onValueChange={setPaidBy} required>
                  <SelectTrigger id="edit-paidBy">
                    <SelectValue placeholder="Select a traveler" />
                  </SelectTrigger>
                  <SelectContent>
                    {trip.travelers.map((traveler) => (
                      <SelectItem key={traveler} value={traveler}>
                        {traveler}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Participants Section */}
              <div className="space-y-2">
                <Label>Participants *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant={participants.length === trip.travelers.length ? "default" : "outline"}
                      size="sm"
                      onClick={toggleAllParticipants}
                      className={
                        participants.length === trip.travelers.length ? "bg-emerald-500 hover:bg-emerald-600" : ""
                      }
                    >
                      All Travelers
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {trip.travelers.map((traveler) => (
                      <Button
                        key={traveler}
                        type="button"
                        variant={participants.includes(traveler) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleParticipant(traveler)}
                        className={participants.includes(traveler) ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                      >
                        {traveler}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details"
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
              <Button type="button" onClick={handleEditExpense} className="bg-emerald-500 hover:bg-emerald-600">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center">
              <Receipt className="h-4 w-4 mr-2 text-emerald-500" />
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(expensesByCategory).length > 0 ? (
              <div>
                <p className="text-2xl font-bold">
                  {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0][0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0][1])}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No expenses yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center">
              <User className="h-4 w-4 mr-2 text-emerald-500" />
              Top Spender
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(expensesByTraveler).length > 0 ? (
              <div>
                <p className="text-2xl font-bold">
                  {Object.entries(expensesByTraveler).sort((a, b) => b[1] - a[1])[0][0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Object.entries(expensesByTraveler).sort((a, b) => b[1] - a[1])[0][1])}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No expenses yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {trip.expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Start tracking your trip expenses"
          action={
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
              <PlusCircle className="mr-2 h-4 w-4" /> Add First Expense
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {trip.expenses.map((expense) => (
            <Card key={expense.id} className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{expense.title}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-emerald-500" />
                        <span>{formatCurrency(expense.amount)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-emerald-500" />
                        <span>{formatDate(expense.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-emerald-500" />
                        <span>Paid by {expense.paidBy}</span>
                      </div>
                      {expense.participants && (
                        <div className="flex items-center mt-1">
                          <Users className="h-4 w-4 mr-1 text-emerald-500" />
                          <span>
                            {expense.participants.length === trip.travelers.length
                              ? "All travelers"
                              : expense.participants.join(", ")}
                          </span>
                        </div>
                      )}
                      {expense.category && (
                        <div className="flex items-center">
                          <Receipt className="h-4 w-4 mr-1 text-emerald-500" />
                          <span>{expense.category}</span>
                        </div>
                      )}
                    </div>
                    {expense.notes && <p className="text-sm text-muted-foreground">{expense.notes}</p>}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
