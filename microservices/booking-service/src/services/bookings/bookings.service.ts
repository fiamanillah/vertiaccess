import { getSiteAvailability } from './availability.service'
import { getCheckoutContext } from './checkout.service'
import { createBooking } from './create-booking.service'
import { listMyBookings, listSiteBookings, listAssetManagerBookings } from './list-bookings.service'
import { getBooking } from './get-booking.service'
import { updateBookingStatus } from './status.service'
import { confirmEmergencyUsage } from './emergency.service'
import { confirmBookingPayment } from './confirm-payment.service'

export class BookingsService {
  static getSiteAvailability = getSiteAvailability
  static getCheckoutContext = getCheckoutContext
  static createBooking = createBooking
  static listMyBookings = listMyBookings
  static listSiteBookings = listSiteBookings
  static listAssetManagerBookings = listAssetManagerBookings
  static getBooking = getBooking
  static updateBookingStatus = updateBookingStatus
  static confirmEmergencyUsage = confirmEmergencyUsage
  static confirmBookingPayment = confirmBookingPayment
}
