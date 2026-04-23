import { 
  BookOpen, Map, FileText, Shield, Search, Calendar, 
  Circle, Pentagon, Clock, Zap, Info, XCircle, Check, MapPin, 
  CheckCircle, Plus, AlertTriangle, Download, CreditCard
} from 'lucide-react';

interface GettingStartedGuideOperatorProps {
  onFindSite: () => void;
}

export function GettingStartedGuideOperator({ onFindSite }: GettingStartedGuideOperatorProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-8 border border-indigo-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <BookOpen className="size-6 text-white" />
          </div>
          <div>
            <h2 className="text-indigo-900 mb-2">Welcome to VertiAccess Operator Portal</h2>
            <p className="text-indigo-800">
              This guide will help you understand how to find TOAL sites, request bookings, select emergency and recovery backup zones, and maintain compliance with digital consent certificates.
            </p>
          </div>
        </div>
      </div>

      {/* Understanding TOAL */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Map className="size-6 text-indigo-600" />
          <h2>Understanding TOAL Sites</h2>
        </div>
        <p className="text-gray-700 mb-4">
          <strong>TOAL</strong> stands for <strong>Take-Off, Approach, and Landing</strong>. These are designated areas where landowners have granted permission for drone operations with explicit consent.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-blue-900 mb-2">Key Points for Operators:</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>TOAL sites require booking and landowner approval</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Sites may have auto-approve or manual approval processes</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Approved bookings generate legal consent certificates</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Some sites are "Exclusive Use" - only one booking at a time</span>
            </li>
          </ul>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1728134462594-09114845f18e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGxhbmRpbmclMjBmaWVsZCUyMGFlcmlhbHxlbnwxfHx8fDE3Njc1NDU2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Drone landing field aerial view"
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>

      {/* Understanding Emergency and Recovery Sites */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="size-6 text-amber-600" />
          <h2>Understanding Emergency and Recovery Sites</h2>
        </div>
        <p className="text-gray-700 mb-4">
          An <strong>Emergency and Recovery Site</strong> is an emergency backup site you select during flight planning. It's where you can land if something goes wrong during your operation.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <h3 className="text-amber-900 mb-2">Important Emergency and Recovery Site Facts:</h3>
          <ul className="space-y-2 text-amber-800 text-sm">
            <li className="flex items-start gap-2">
              <Info className="size-5 flex-shrink-0 mt-0.5" />
              <span><strong>No booking required</strong> - Emergency and Recovery is for planning only</span>
            </li>
            <li className="flex items-start gap-2">
              <Info className="size-5 flex-shrink-0 mt-0.5" />
              <span><strong>Landowner notification</strong> - They'll be informed but don't approve/reject</span>
            </li>
            <li className="flex items-start gap-2">
              <Info className="size-5 flex-shrink-0 mt-0.5" />
              <span><strong>Emergency use only</strong> - Use only in actual emergencies</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="size-5 flex-shrink-0 mt-0.5" />
              <span><strong>Your responsibility</strong> - Arrange retrieval within 24 hours if used</span>
            </li>
          </ul>
        </div>

        {/* Red Zone Explanation */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
          <h3 className="text-red-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Understanding the Red Zone (TOAL Area)
          </h3>
          <p className="text-sm text-red-800 mb-3">
            When viewing sites with both TOAL and Emergency and Recovery enabled, you'll see the map display a <strong className="text-red-900">red zone</strong> and an outer area:
          </p>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full opacity-60"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900 mb-1">Red Zone = TOAL Area (Circle or Polygon)</p>
                  <p className="text-xs text-red-800">
                    This is the <strong>Take-Off, Approach, and Landing</strong> area. If you select this site as an emergency backup, <strong className="underline">you CANNOT land in the red zone</strong>. The red zone is reserved for planned TOAL bookings only.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 border-4 border-blue-500 rounded-full bg-transparent"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Outer Area = Emergency and Recovery Zone (Donut Shape)</p>
                  <p className="text-xs text-blue-800">
                    The area <strong>outside the red zone but inside the emergency boundary</strong> is where you can perform emergency landings. This creates a "donut" or "ring" shape around the TOAL area.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-red-300">
            <p className="text-xs text-red-900 font-medium">
              ⚠️ Critical: If you have a TOAL booking for the red zone AND select the same site as emergency backup, the red zone is OFF-LIMITS for emergency landings. Only use the outer emergency ring area.
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-900 mb-2">Best Practice:</h3>
          <p className="text-sm text-green-800">
            Always select at least one emergency and recovery site along your flight path. Choose open areas with good access. If you actually use an emergency site, contact the landowner immediately using the details in your selection confirmation.
          </p>
        </div>
      </div>

      {/* How to Find and Book a TOAL Site */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="size-6 text-green-600" />
          <h2>How to Find and Book a TOAL Site</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Click "Find TOAL Site" Button
            </h3>
            <p className="text-sm text-gray-700 ml-8">
              Opens the interactive map showing all available TOAL sites in your area with real-time availability.
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Search and Filter Sites
            </h3>
            <p className="text-sm text-gray-700 ml-8 mb-3">
              Use search tools to find the perfect site:
            </p>
            <ul className="text-sm text-gray-700 ml-8 space-y-1">
              <li>• Search by location, postcode, or coordinates</li>
              <li>• Filter by site type (Private Land, Helipad, Vertiport, etc.)</li>
              <li>• Filter by features (Auto-approve, Emergency and Recovery enabled)</li>
              <li>• Check availability for your required dates/times</li>
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Review Site Details
            </h3>
            <p className="text-sm text-gray-700 ml-8 mb-3">
              Click on any site marker to view:
            </p>
            <ul className="text-sm text-gray-700 ml-8 space-y-1">
              <li>• Site boundaries and geometry (circle or polygon)</li>
              <li>• Pricing information</li>
              <li>• Approval type (Auto or Manual)</li>
              <li>• Exclusive use status</li>
              <li>• Emergency and Recovery availability</li>
              <li>• Existing bookings (deconfliction calendar)</li>
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
              Submit Your Booking Request
            </h3>
            <p className="text-sm text-gray-700 ml-8 mb-3">
              Fill in required details:
            </p>
            <ul className="text-sm text-gray-700 ml-8 space-y-1">
              <li>• Operation reference number</li>
              <li>• Flyer ID (your operator license number)</li>
              <li>• Drone model</li>
              <li>• Mission intent (what you're doing)</li>
              <li>• Start and end time window</li>
            </ul>
            <div className="ml-8 mt-3 grid md:grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="size-5 text-green-600" />
                  <p className="font-medium text-green-900 text-sm">Auto-Approve Sites</p>
                </div>
                <p className="text-xs text-green-800">
                  Instant approval! Your consent certificate is generated immediately.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="size-5 text-blue-600" />
                  <p className="font-medium text-blue-900 text-sm">Manual Approval Sites</p>
                </div>
                <p className="text-xs text-blue-800">
                  Wait for landowner to review and approve. You'll receive a notification.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
              Download Your Consent Certificate
            </h3>
            <p className="text-sm text-gray-700 ml-8">
              Once approved, your digital consent certificate is available in the "Certificates" tab. Download and keep it with your flight documentation for compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Exclusive Use Warning */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-6 text-purple-700 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-purple-900 mb-2">Exclusive Use Sites</h3>
            <p className="text-purple-800 text-sm mb-3">
              Some sites are marked as "Exclusive Use" - meaning only ONE TOAL booking is allowed at a time. The platform will warn you if:
            </p>
            <ul className="text-sm text-purple-800 space-y-1 list-disc ml-5">
              <li>You try to book an exclusive use site that already has a booking</li>
              <li>Your requested time overlaps with an existing booking</li>
            </ul>
            <p className="text-sm text-purple-800 mt-3">
              <strong>Note:</strong> Emergency and Recovery site selections are still allowed on exclusive use sites - they don't create booking conflicts.
            </p>
          </div>
        </div>
      </div>

      {/* How to Select an Emergency and Recovery Site */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="size-6 text-amber-600" />
          <h2>How to Select an Emergency and Recovery Site (Emergency Backup)</h2>
        </div>
        <div className="space-y-4">
          <p className="text-gray-700">
            Select emergency and recovery sites along your planned flight route for emergency contingency planning:
          </p>
          
          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Find Emergency and Recovery Enabled Sites
            </h3>
            <p className="text-sm text-gray-700 ml-8">
              In the site discovery map, filter for "Emergency and Recovery Enabled" sites. These are areas where landowners permit emergency landings.
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Select Emergency and Recovery Site (No Approval Needed)
            </h3>
            <p className="text-sm text-gray-700 ml-8">
              Click "Select for Emergency" and enter your flight details. This is informational only - no landowner approval required.
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Landowner Receives Notification
            </h3>
            <p className="text-sm text-gray-700 ml-8">
              The landowner is notified that their site is selected as backup. They can see your contact details in case of actual emergency use.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <h3 className="text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              If You Actually Use an Emergency Site
            </h3>
            <ul className="text-sm text-red-800 space-y-2">
              <li>1. <strong>Contact the landowner immediately</strong> using the details in your selection confirmation</li>
              <li>2. <strong>Do not leave the drone unattended</strong> for extended periods</li>
              <li>3. <strong>Arrange retrieval within 24 hours</strong></li>
              <li>4. <strong>Document the incident</strong> for your records and regulatory compliance</li>
              <li>5. <strong>Declare usage in your dashboard</strong> - Go to "Emergency Selections" tab and confirm whether you used the site or not</li>
              <li>6. <strong>Landing fee will apply</strong> - If you confirm usage, you will be charged the landowner's emergency landing fee automatically</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-red-300">
              <p className="text-sm text-red-900 font-medium">
                ⚠️ Important: You must declare usage within 24 hours of your operation end time. Failure to declare usage is a compliance violation and may result in account suspension.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Understanding Consent Certificates */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="size-6 text-purple-600" />
          <h2>Understanding Consent Certificates</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Every approved TOAL booking generates a digital consent certificate with legal validity. This proves you have landowner permission.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-900 mb-2 flex items-center gap-2">
              <Check className="size-5" />
              Certificate Includes
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Unique certificate ID</li>
              <li>✓ Landowner details and authorization</li>
              <li>✓ Site location with map snapshot</li>
              <li>✓ Your operator details and Flyer ID</li>
              <li>✓ Approved time window</li>
              <li>✓ Mission intent</li>
              <li>✓ Digital signature and verification URL</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-900 mb-2 flex items-center gap-2">
              <Download className="size-5" />
              What to Do With It
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Download PDF copy for your records</li>
              <li>✓ Keep with flight documentation</li>
              <li>✓ Present to authorities if requested</li>
              <li>✓ Share verification URL if needed</li>
              <li>✓ Store securely for regulatory compliance</li>
            </ul>
          </div>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1654931799020-ce7cf3f4a2c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N1bWVudCUyMGNoZWNrbGlzdHxlbnwxfHx8fDE3Njc1NDU2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Document checklist"
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      {/* Payment and Costs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="size-6 text-green-600" />
          <h2>Payment and Costs</h2>
        </div>
        <p className="text-gray-700 mb-4">
          TOAL bookings require payment to the landowner plus a small platform fee. Emergency and Recovery site selections are free.
        </p>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-900 mb-2">TOAL Booking Costs</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-medium">Site Fee:</span>
                <span>Set by landowner (typically £25-150 per booking)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Platform Fee:</span>
                <span>20% of site fee (automatically added)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Payment:</span>
                <span>Charged when booking is approved</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-900 mb-2">Emergency and Recovery Site Selections</h3>
            <p className="text-sm text-green-800">
              <strong>Free of charge</strong> - These selections don't cost anything. You only pay if you actually use the site in an emergency (compensation negotiated directly with landowner).
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-amber-900 mb-2">Adding a Payment Card</h3>
            <p className="text-sm text-amber-800">
              Add a payment card in your Profile settings to enable instant bookings. Without a payment card, you can browse sites but cannot complete booking requests.
            </p>
          </div>
        </div>
      </div>

      {/* Deconfliction Calendar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="size-6 text-blue-600" />
          <h2>Deconfliction Calendar</h2>
        </div>
        <p className="text-gray-700 mb-4">
          When viewing site details, you'll see a deconfliction calendar showing existing bookings from other operators.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 mb-2">What You Can See:</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Time slots when the site is already booked</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Available time windows for your booking</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Whether site has exclusive use restrictions</span>
            </li>
          </ul>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
          <h3 className="text-gray-900 mb-2">Privacy Note:</h3>
          <p className="text-sm text-gray-700">
            For privacy, you cannot see other operators' details (Flyer IDs, mission intent, etc.). You only see that time slots are occupied.
          </p>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="size-6 text-green-600" />
          <h2>Operator Best Practices</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-green-900 mb-3 flex items-center gap-2">
              <Check className="size-5" />
              DO THIS
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Book sites well in advance (24-48 hours recommended)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Select at least one emergency and recovery site along your flight path</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Download and carry consent certificates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Cancel bookings you no longer need</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Respect exclusive use restrictions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Contact landowner if plans change</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-red-900 mb-3 flex items-center gap-2">
              <XCircle className="size-5" />
              NEVER DO THIS
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never operate without a valid consent certificate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never exceed the approved time window</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never use an emergency and recovery site for planned operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never provide false information in booking requests</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never book sites you don't intend to use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never operate outside the defined site boundaries</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-green-900 mb-4">💡 Quick Tips for Success</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
          <div>
            <p className="font-medium mb-1">🎯 Choose Auto-Approve Sites</p>
            <p>Get instant confirmation without waiting for landowner approval</p>
          </div>
          <div>
            <p className="font-medium mb-1">📅 Check Deconfliction Calendar</p>
            <p>Avoid booking conflicts by reviewing existing bookings first</p>
          </div>
          <div>
            <p className="font-medium mb-1">🛡️ Always Select Emergency and Recovery Sites</p>
            <p>Plan for emergencies - select backup landing zones along your route</p>
          </div>
          <div>
            <p className="font-medium mb-1">📄 Download Certificates</p>
            <p>Keep digital and printed copies for compliance</p>
          </div>
          <div>
            <p className="font-medium mb-1">💳 Add Payment Card Early</p>
            <p>Enable instant bookings by adding payment details to your profile</p>
          </div>
          <div>
            <p className="font-medium mb-1">🔔 Enable Notifications</p>
            <p>Get instant alerts when bookings are approved or rejected</p>
          </div>
        </div>
      </div>

      {/* Ready to Start */}
      <div className="bg-indigo-600 rounded-lg p-8 text-center">
        <h2 className="text-white mb-4">Ready to Find Your First TOAL Site?</h2>
        <button
          onClick={onFindSite}
          className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium inline-flex items-center gap-2"
        >
          <MapPin className="size-5" />
          Find TOAL Site
        </button>
      </div>
    </div>
  );
}