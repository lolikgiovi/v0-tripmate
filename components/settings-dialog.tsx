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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Settings } from "lucide-react"
import { getCurrencyPreference, setCurrencyPreference } from "@/lib/utils"

export function SettingsDialog() {
  const [currency, setCurrency] = useState<string>("USD")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setCurrency(getCurrencyPreference())
  }, [isOpen])

  const handleSave = () => {
    setCurrencyPreference(currency)
    setIsOpen(false)
    // Force reload to apply currency changes throughout the app
    window.location.reload()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your app preferences</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <RadioGroup value={currency} onValueChange={setCurrency} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USD" id="usd" />
                <Label htmlFor="usd" className="font-normal">
                  USD ($)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="IDR" id="idr" />
                <Label htmlFor="idr" className="font-normal">
                  IDR (Rp)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
