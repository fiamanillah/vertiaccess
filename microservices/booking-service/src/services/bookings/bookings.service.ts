import { getSiteAvailability } from './availability.service'
import { getCheckoutContext } from './checkout.service'
import { createBooking } from './create-booking.service'
import { listMyBookings, listSiteBookings, listLandownerBookings } from './list-bookings.service'
import { getBooking } from './get-booking.service'
import { getBookingCertificate } from './certificate.service'
import { updateBookingStatus } from './status.service'
import { confirmEmergencyUsage } from './emergency.service'
import { confirmBookingPayment } from './confirm-payment.service'

export class BookingsService {
  static getSiteAvailability = getSiteAvailability
  static getCheckoutContext = getCheckoutContext
  static createBooking = createBooking
  static listMyBookings = listMyBookings
  static listSiteBookings = listSiteBookings
  static listLandownerBookings = listLandownerBookings
  static getBooking = getBooking
  static getBookingCertificate = getBookingCertificate
  static updateBookingStatus = updateBookingStatus
  static confirmEmergencyUsage = confirmEmergencyUsage
  static confirmBookingPayment = confirmBookingPayment
}
