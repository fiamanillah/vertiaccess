'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AddCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

import { useTheme } from 'next-themes'
import {
  paymentService,
  type SetupIntentResponse,
} from '@/services/payments/payment.service'

function AddCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { resolvedTheme } = useTheme()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [name, setName] = React.useState('')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)

    try {
      // Confirm the card setup using the pre-created SetupIntent from the payment service.
      const { setupIntent, error } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: { name },
          },
        },
      )

      if (error) {
        toast.error(error.message || 'Failed to setup card')
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        // 3. Save payment method to the backend database
        await paymentService.savePaymentMethod(
          setupIntent.payment_method as string,
        )
        toast.success('Card added successfully')
        onSuccess()
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Cardholder Name
          </label>
          <input
            type="text"
            required
            placeholder="John Smith"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Card Details
          </label>
          <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
            <div className="w-full">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '14px',
                      color: isDark ? '#ffffff' : '#09090b',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      '::placeholder': {
                        color: isDark ? '#71717a' : '#a1a1aa',
                      },
                    },
                    invalid: {
                      color: '#ef4444',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="min-w-30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            'Add Card'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AddCardModal({
  open,
  onOpenChange,
  onSuccess,
}: AddCardModalProps) {
  const [setupIntentData, setSetupIntentData] =
    React.useState<SetupIntentResponse | null>(null)
  const [isLoadingSetup, setIsLoadingSetup] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setSetupIntentData(null)
      setIsLoadingSetup(false)
      return
    }

    let cancelled = false
    setIsLoadingSetup(true)

    paymentService
      .createSetupIntent()
      .then((response) => {
        if (!cancelled) setSetupIntentData(response)
      })
      .catch((error) => {
        console.error('Failed to initialize payment setup:', error)
        if (!cancelled) setSetupIntentData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSetup(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>
            Securely add a new payment method to your account.
          </DialogDescription>
        </DialogHeader>

        {isLoadingSetup || !setupIntentData?.clientSecret ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing secure card setup...
          </div>
        ) : (
          <Elements stripe={getStripe(setupIntentData.publishableKey)}>
            <AddCardForm
              clientSecret={setupIntentData.clientSecret}
              onSuccess={() => {
                onSuccess()
                onOpenChange(false)
              }}
              onCancel={() => onOpenChange(false)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
