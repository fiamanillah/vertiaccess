const updateSiteOptions = React.useCallback((bookings: Booking[]) => {
    setSiteOptions((current) => {
      const next = new Map(current.map((site) => [site.id, site]))
      bookings.forEach((booking) => {
        if (booking.siteId && booking.siteName) {
          next.set(booking.siteId, {
            id: booking.siteId,
            name: booking.siteName,