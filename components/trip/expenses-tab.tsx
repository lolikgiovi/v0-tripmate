"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PlusCircle,
  Receipt,
  Calendar,
  DollarSign,
  User,
  Pencil,
  Trash2,
  Users,
  Plus,
  X,
  SortAsc,
  SortDesc,
  AlignJustify,
} from "lucide-react"
import type { Expense, Trip, PayerContribution } from "@/lib/types"
import { generateId, formatDate, formatCurrency, convertToUSD, convertFromUSD, getCurrencySymbol } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define sort options
type SortOption = {
  id: string
  label: string
  icon: React.ReactNode
  sortFn: (a: Expense, b: Expense) => number
}

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
  const [notes, setNotes] = useState("")
  const [participants, setParticipants] = useState<string[]>([])
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol())

  // Multiple payers state
  const [payers, setPayers] = useState<PayerContribution[]>([])
  const [newPayerName, setNewPayerName] = useState("")
  const [newPayerAmount, setNewPayerAmount] = useState("")
  const [payerError, setPayerError] = useState("")

  // Sorting state
  const [sortOption, setSortOption] = useState<string>("dateDesc")
  const [sortedExpenses, setSortedExpenses] = useState<Expense[]>([...trip.expenses])

  // Define sort options
  const sortOptions: SortOption[] = [
    {
      id: "titleAsc",
      label: "Title (A-Z)",
      icon: <SortAsc className="h-4 w-4 mr-2" />,
      sortFn: (a, b) => a.title.localeCompare(b.title),
    },
    {
      id: "titleDesc",
      label: "Title (Z-A)",
      icon: <SortDesc className="h-4 w-4 mr-2" />,
      sortFn: (a, b) => b.title.localeCompare(a.title),
    },
    {
      id: "dateAsc",
      label: "Date (Oldest first)",
      icon: <Calendar className="h-4 w-4 mr-2" />,
      sortFn: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      id: "dateDesc",
      label: "Date (Newest first)",
      icon: <Calendar className="h-4 w-4 mr-2" />,
      sortFn: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    },
    {
      id: "amountAsc",
      label: "Amount (Low to High)",
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      sortFn: (a, b) => a.amount - b.amount,
    },
    {
      id: "amountDesc",
      label: "Amount (High to Low)",
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      sortFn: (a, b) => b.amount - a.amount,
    },
    {
      id: "categoryAsc",
      label: "Category (A-Z)",
      icon: <AlignJustify className="h-4 w-4 mr-2" />,
      sortFn: (a, b) => (a.category || "").localeCompare(b.category || ""),
    },
  ]

  // Get current sort option
  const getCurrentSortOption = () => {
    return sortOptions.find((option) => option.id === sortOption) || sortOptions[3] // Default to dateDesc
  }

  // Update currency symbol when component mounts
  useEffect(() => {
    setCurrencySymbol(getCurrencySymbol())
  }, [])

  // Sort expenses when trip.expenses or sortOption changes
  useEffect(() => {
    const currentSortOption = getCurrentSortOption()
    const sorted = [...trip.expenses].sort(currentSortOption.sortFn)
    setSortedExpenses(sorted)
  }, [trip.expenses, sortOption])

  // Calculate total amount paid by all payers
  const totalPaid = payers.reduce((sum, payer) => sum + payer.amount, 0)

  // Calculate remaining amount to be allocated
  const remainingAmount = amount ? Math.max(0, convertToUSD(Number(amount)) - totalPaid) : 0

  // Format the remaining amount for display
  const formattedRemainingAmount = formatCurrency(remainingAmount)

  const resetForm = () => {
    setTitle("")
    setAmount("")
    setDate("")
    setCategory("")
    setPayers([])
    setParticipants([])
    setNotes("")
    setCurrentExpense(null)
    setNewPayerName("")
    setNewPayerAmount("")
    setPayerError("")
  }

  const openEditDialog = (expense: Expense) => {
    setCurrentExpense(expense)
    setTitle(expense.title)
    // Convert the stored USD amount to the display currency
    setAmount(convertFromUSD(expense.amount).toString())
    setDate(expense.date)
    setCategory(expense.category || "")

    // Convert payer amounts from USD to display currency
    setPayers(
      expense.payers.map((payer) => ({
        name: payer.name,
        amount: payer.amount,
      })),
    )

    setParticipants(expense.participants || [])
    setNotes(expense.notes || "")
    setIsEditDialogOpen(true)
  }

  const addPayer = () => {
    if (!newPayerName) {
      setPayerError("Please select a payer")
      return
    }

    if (!newPayerAmount || Number(newPayerAmount) <= 0) {
      setPayerError("Please enter a valid amount")
      return
    }

    // Convert input amount to USD for storage
    const payerAmountUSD = convertToUSD(Number(newPayerAmount))

    // Check if payer already exists
    const existingPayerIndex = payers.findIndex((p) => p.name === newPayerName)

    if (existingPayerIndex >= 0) {
      // Update existing payer
      const updatedPayers = [...payers]
      updatedPayers[existingPayerIndex].amount += payerAmountUSD
      setPayers(updatedPayers)
    } else {
      // Add new payer
      setPayers([...payers, { name: newPayerName, amount: payerAmountUSD }])
    }

    setNewPayerName("")
    setNewPayerAmount("")
    setPayerError("")
  }

  const removePayer = (index: number) => {
    setPayers(payers.filter((_, i) => i !== index))
  }

  const validatePayersTotal = (): boolean => {
    if (!amount || payers.length === 0) return false

    const totalAmount = convertToUSD(Number(amount))
    const totalPaid = payers.reduce((sum, payer) => sum + payer.amount, 0)

    // Allow a small rounding error (0.01)
    return Math.abs(totalAmount - totalPaid) < 0.01
  }

  const handleAddExpense = () => {
    if (!title || !amount || !date || participants.length === 0) {
      alert("Please fill in all required fields and select at least one participant")
      return
    }

    if (payers.length === 0) {
      alert("Please add at least one payer")
      return
    }

    if (!validatePayersTotal()) {
      alert(
        `The total paid amount must equal the expense amount (${formatCurrency(convertToUSD(Number(amount)))}). Current total: ${formatCurrency(totalPaid)}`,
      )
      return
    }

    const newExpense: Expense = {
      id: generateId(),
      title,
      // Convert the display currency amount to USD for storage
      amount: convertToUSD(Number.parseFloat(amount)),
      date,
      category: category || undefined,
      payers: payers,
      participants,
      notes: notes || undefined,
    }

    // We don't sort here anymore, as the sorting is handled by the useEffect
    const updatedTrip = {
      ...trip,
      expenses: [...trip.expenses, newExpense],
    }

    updateTrip(updatedTrip)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditExpense = () => {
    if (!currentExpense || !title || !amount || !date || participants.length === 0) {
      alert("Please fill in all required fields and select at least one participant")
      return
    }

    if (payers.length === 0) {
      alert("Please add at least one payer")
      return
    }

    if (!validatePayersTotal()) {
      alert(
        `The total paid amount must equal the expense amount (${formatCurrency(convertToUSD(Number(amount)))}). Current total: ${formatCurrency(totalPaid)}`,
      )
      return
    }

    const updatedExpense: Expense = {
      ...currentExpense,
      title,
      // Convert the display currency amount to USD for storage
      amount: convertToUSD(Number.parseFloat(amount)),
      date,
      category: category || undefined,
      payers: payers,
      participants,
      notes: notes || undefined,
    }

    // We don't sort here anymore, as the sorting is handled by the useEffect
    const updatedTrip = {
      ...trip,
      expenses: trip.expenses.map((expense) => (expense.id === currentExpense.id ? updatedExpense : expense)),
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
      // Add each payer's contribution
      expense.payers.forEach((payer) => {
        if (!travelers[payer.name]) {
          travelers[payer.name] = 0
        }
        travelers[payer.name] += payer.amount
      })
      return travelers
    },
    {} as Record<string, number>,
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Trip Expenses</h3>
        <div className="flex gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                {getCurrentSortOption().icon}
                <span className="hidden sm:inline">Sort by:</span> {getCurrentSortOption().label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sort Expenses</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setSortOption(option.id)}
                    className={sortOption === option.id ? "bg-muted" : ""}
                  >
                    {option.icon}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
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
                    <Label htmlFor="amount">Total Amount ({currencySymbol}) *</Label>
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

                  {/* Payers Section */}
                  <div className="space-y-2 border p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <Label>Payers *</Label>
                      <div className="text-sm text-muted-foreground">Remaining: {formattedRemainingAmount}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="payerName" className="text-xs">
                          Name
                        </Label>
                        <Select value={newPayerName} onValueChange={setNewPayerName}>
                          <SelectTrigger id="payerName">
                            <SelectValue placeholder="Select" />
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
                      <div>
                        <Label htmlFor="payerAmount" className="text-xs">
                          Amount ({currencySymbol})
                        </Label>
                        <div className="flex">
                          <Input
                            id="payerAmount"
                            type="number"
                            value={newPayerAmount}
                            onChange={(e) => setNewPayerAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="rounded-r-none"
                          />
                          <Button
                            type="button"
                            onClick={addPayer}
                            className="rounded-l-none bg-emerald-500 hover:bg-emerald-600"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {payerError && <p className="text-sm text-red-500">{payerError}</p>}

                    {payers.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {payers.map((payer, index) => (
                          <div key={index} className="flex justify-between items-center bg-muted p-2 rounded-md">
                            <span>{payer.name}</span>
                            <div className="flex items-center gap-2">
                              <span>{formatCurrency(payer.amount)}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={() => removePayer(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
              </ScrollArea>
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
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">Total Amount ({currencySymbol}) *</Label>
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

              {/* Payers Section */}
              <div className="space-y-2 border p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <Label>Payers *</Label>
                  <div className="text-sm text-muted-foreground">Remaining: {formattedRemainingAmount}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-payerName" className="text-xs">
                      Name
                    </Label>
                    <Select value={newPayerName} onValueChange={setNewPayerName}>
                      <SelectTrigger id="edit-payerName">
                        <SelectValue placeholder="Select" />
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
                  <div>
                    <Label htmlFor="edit-payerAmount" className="text-xs">
                      Amount ({currencySymbol})
                    </Label>
                    <div className="flex">
                      <Input
                        id="edit-payerAmount"
                        type="number"
                        value={newPayerAmount}
                        onChange={(e) => setNewPayerAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="rounded-r-none"
                      />
                      <Button
                        type="button"
                        onClick={addPayer}
                        className="rounded-l-none bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {payerError && <p className="text-sm text-red-500">{payerError}</p>}

                {payers.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {payers.map((payer, index) => (
                      <div key={index} className="flex justify-between items-center bg-muted p-2 rounded-md">
                        <span>{payer.name}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(payer.amount)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={() => removePayer(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
          </ScrollArea>
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
          {sortedExpenses.map((expense) => (
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

                      {/* Display payers */}
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-emerald-500" />
                        <span>
                          Paid by:{" "}
                          {expense.payers.map((payer, i) => (
                            <span key={payer.name}>
                              {i > 0 && ", "}
                              {payer.name} ({formatCurrency(payer.amount)})
                            </span>
                          ))}
                        </span>
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
