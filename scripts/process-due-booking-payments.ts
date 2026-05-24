type SchedulerEvent = {
  id?: string
  time?: string
}

export async function handler(event: SchedulerEvent) {
  const apiBaseUrl = process.env.API_BASE_URL
  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL is required')
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/payments/v1/bookings/process-due-payments`
  const bookingChargeKey = process.env.BOOKING_CHARGE_KEY || ''

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(bookingChargeKey ? { 'x-booking-charge-key': bookingChargeKey } : {}),
    },
    body: JSON.stringify({
      source: 'sst-cron',
      event,
      at: new Date().toISOString(),
    }),
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`Due payment cron failed (${response.status}): ${text}`)
  }

  console.log('Due payment cron completed', {
    status: response.status,
    response: text,
  })

  return {
    ok: true,
    status: response.status,
  }
}
