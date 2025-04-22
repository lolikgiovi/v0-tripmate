export interface Trip {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  budget: number
  destinations: string[]
  travelers: string[]
  agenda: AgendaItem[]
  expenses: Expense[]
}

export interface AgendaItem {
  id: string
  title: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  estimatedCost?: number
}

export interface Expense {
  id: string
  title: string
  amount: number
  date: string
  category?: string
  payers: PayerContribution[] // Replace paidBy with payers array
  participants: string[] // Who participated in the expense
  notes?: string
}

// New interface for payer contributions
export interface PayerContribution {
  name: string
  amount: number
}
