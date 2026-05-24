import { AppError, HTTPStatusCode } from '@vertiaccess/core'

const DEFAULT_RETRIES = 3
const DEFAULT_TIMEOUT = 5000 // ms per attempt

function sleep(ms: number) {
  const setTimeoutAny = (globalThis as any).setTimeout as any
  return new Promise((res) => setTimeoutAny(() => res(undefined), ms))
}

export interface ChargeResponse {
  ok: boolean
  status: number
  body?: any
}

export async function callPaymentEndpoint(
  path: string,
  method = 'POST',
  body?: any,
  opts?: { retries?: number; timeoutMs?: number },
): Promise<ChargeResponse> {
  const paymentBase = process.env.PAYMENT_SERVICE_INTERNAL_URL
  const key = process.env.BOOKING_CHARGE_KEY
  if (!paymentBase || !key) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Payment service not configured',
    })
  }

  const retries = opts?.retries ?? DEFAULT_RETRIES
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT

  const url = `${paymentBase.replace(/\/$/, '')}${path}`

  let lastErr: any
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const setTimeoutAny = (globalThis as any).setTimeout as any
      const clearTimeoutAny = (globalThis as any).clearTimeout as any
      const id = setTimeoutAny(() => controller.abort(), timeoutMs)

      const res = await fetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          'content-type': 'application/json',
          'x-booking-charge-key': key,
        },
        signal: controller.signal as any,
      })
      clearTimeoutAny(id)

      const text = await res.text()
      let parsed: any = undefined
      try {
        parsed = text ? JSON.parse(text) : undefined
      } catch (_) {
        parsed = text
      }

      if (res.ok) return { ok: true, status: res.status, body: parsed }
      lastErr = { ok: false, status: res.status, body: parsed }
      throw lastErr
    } catch (err: any) {
      lastErr = err
      if (attempt < retries) {
        const backoff = 100 * Math.pow(2, attempt - 1)
        await sleep(backoff)
        continue
      }
    }
  }

  const lambdaArn = process.env.BOOKING_CHARGE_LAMBDA_ARN
  if (lambdaArn) {
    try {
      // Dynamically require aws-sdk to avoid a hard dependency in environments
      // where it's not installed. Typings may not be available locally.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AWS = require('aws-sdk') as any
      const lambda = new AWS.Lambda({ region: process.env.AWS_REGION })
      const payload = JSON.stringify({ path, method, body })
      const result = await lambda
        .invoke({
          FunctionName: lambdaArn,
          InvocationType: 'RequestResponse',
          Payload: payload,
        })
        .promise()

      const payloadStr = result.Payload as string | undefined
      let parsed: any
      try {
        parsed = payloadStr ? JSON.parse(payloadStr) : undefined
      } catch (_) {
        parsed = payloadStr
      }

      const statusCode = (result as any).StatusCode ?? 200
      if (statusCode >= 200 && statusCode < 300) {
        return { ok: true, status: statusCode, body: parsed }
      }
      return { ok: false, status: statusCode, body: parsed }
    } catch (lambdaErr) {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_GATEWAY,
        message: 'Payment service unreachable',
      })
    }
  }

  throw new AppError({
    statusCode: HTTPStatusCode.BAD_GATEWAY,
    message: 'Payment service unreachable',
  })
}
