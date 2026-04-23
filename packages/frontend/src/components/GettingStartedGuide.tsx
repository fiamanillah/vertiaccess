import { 
  BookOpen, Map, FileText, Shield, Bell, ThumbsUp, ThumbsDown, 
  Circle, Pentagon, Clock, Zap, Info, XCircle, Check, MapPin, 
  CheckCircle, Plus, AlertTriangle
} from 'lucide-react';

interface GettingStartedGuideProps {
  onCreateSite: () => void;
}

export function GettingStartedGuide({ onCreateSite }: GettingStartedGuideProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-8 border border-indigo-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <BookOpen className="size-6 text-white" />
          </div>
          <div>
            <h2 className="text-indigo-900 mb-2">Welcome to VertiAccess Landowner Portal</h2>
            <p className="text-indigo-800">
              This guide will help you understand how to create and manage TOAL sites, enable emergency and recovery site functionality, approve booking requests, and earn revenue from drone operators safely and securely.
            </p>
          </div>
        </div>
      </div>

      {/* What is a TOAL Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Map className="size-6 text-indigo-600" />
          <h2>What is a TOAL Site?</h2>
        </div>
        <p className="text-gray-700 mb-4">
          <strong>TOAL</strong> stands for <strong>Take-Off, Approach, and Landing</strong>. It's a designated area on your property where drone operators can legally take off and land their drones with your explicit consent.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-blue-900 mb-2">Key Benefits:</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Generate revenue from your land</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Full control - you approve or reject every booking request</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Digital consent certificates for compliance</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-5 flex-shrink-0 mt-0.5" />
              <span>Temporary restrictions available anytime</span>
            </li>
          </ul>
        </div>

        <img 
          src="https://images.unsplash.com/photo-1728134462594-09114845f18e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGxhbmRpbmclMjBmaWVsZCUyMGFlcmlhbHxlbnwxfHx8fDE3Njc1NDU2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Drone landing field aerial view"
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>

      {/* What is an Emergency and Recovery Site Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="size-6 text-amber-600" />
          <h2>What is an Emergency and Recovery Site?</h2>
        </div>
        <p className="text-gray-700 mb-4">
          An <strong>Emergency and Recovery Site</strong> is an emergency backup site that drone operators can select <strong>for planning purposes only</strong>. It's used if something goes wrong during their flight and they need an emergency landing spot.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <h3 className="text-amber-900 mb-2">Important Emergency and Recovery Site Facts:</h3>
          <ul className="space-y-2 text-amber-800 text-sm">
            <li className="flex items-start gap-2">
              <Info className="size-5 flex-shrink-0 mt-0.5" />
              <span><strong>No approval required</strong> - Emergency and Recovery site selections are informational only</span>
            </li>
            <li className="flex items-start gap-2">
              <Info className="size-5 flex-shrink-0 mt-0.5" />
              <span><strong>No booking conflicts</strong> - Emergency and Recovery sites don't block TOAL bookings</span>
            </li>
            <li className="flex items-start gap-2">
              <Info className="size-5 flex-shrink-0 mt-0.5" />
              <span><strong>Emergency use only</strong> - 95%+ of emergency and recovery site selections are never used</span>
            </li>
            <li className="flex items-start gap-2">
              <Bell className="size-5 flex-shrink-0 mt-0.5" />
              <span>You'll receive notifications when your site is selected as an Emergency and Recovery site</span>
            </li>
          </ul>
        </div>

        {/* CLZ Scenarios */}
        <div className="mb-4">
          <h3 className="mb-3 flex items-center gap-2">
            <CheckCircle className="size-5 text-green-600" />
            Good Emergency and Recovery Site Examples
          </h3>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900 font-medium mb-1">✓ Open Field Along Flight Path</p>
              <p className="text-sm text-green-800">Large open area suitable for emergency landing. No overhead hazards. Easy access for drone recovery. Emergency and Recovery enabled to help operators plan safe routes.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900 font-medium mb-1">✓ Parking Lot (off-hours Emergency and Recovery site)</p>
              <p className="text-sm text-green-800">Empty parking lot available as emergency landing zone during non-business hours. Emergency and Recovery enabled. Not used for planned TOAL bookings, only emergency backup.</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-600" />
            Bad Emergency and Recovery Site Examples
          </h3>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900 font-medium mb-1">✗ Wooded Area with Dense Trees</p>
              <p className="text-sm text-red-800">Dense canopy makes emergency landing nearly impossible. Drone would likely crash into trees. Not suitable as an Emergency and Recovery site - creates false safety option.</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900 font-medium mb-1">✗ Water Body (lake/pond without flat shore)</p>
              <p className="text-sm text-red-800">No solid landing surface. Drone would be damaged/lost. Emergency and Recovery sites should only be enabled for areas with safe landing surfaces.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multiple Sites Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="size-6 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-900 mb-2">Multiple Sites on One Property</h3>
            <p className="text-amber-800 text-sm mb-3">
              <strong>Important:</strong> If you have a large estate that can accommodate more than one TOAL or Emergency and Recovery site, you must create a <strong>separate application for each distinct landing zone</strong>.
            </p>
            <div className="text-sm text-amber-800 space-y-2">
              <p className="font-medium">Why separate applications?</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Operators need precise location information for each landing zone</li>
                <li>Different areas may have different availability schedules</li>
                <li>Each site can have unique pricing and booking terms</li>
                <li>Separate geometry boundaries prevent booking conflicts</li>
                <li>Individual certificates required for each distinct site</li>
              </ul>
              <p className="mt-3 bg-amber-100 border border-amber-300 rounded p-2">
                <strong>Example:</strong> A 50-hectare farm with three viable landing areas should create 3 separate TOAL sites: "North Field - Farm TOAL", "South Meadow - Farm TOAL", and "Equipment Yard - Farm TOAL" - each with its own geometry, pricing, and availability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Create a TOAL Site */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="size-6 text-green-600" />
          <h2>How to Create a TOAL Site</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Click "Add Site" Button
            </h3>
            <p className="text-sm text-gray-700 ml-8">
              Located at the top of your dashboard. This starts the multi-step wizard.
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Define Your Site Geometry
            </h3>
            <p className="text-sm text-gray-700 ml-8 mb-3">
              Use the interactive map to draw your site boundary:
            </p>
            <div className="ml-8 grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="size-5 text-indigo-600" />
                  <p className="font-medium">Circle (for Helipads/Vertiports)</p>
                </div>
                <p className="text-sm text-gray-600">
                  Click center point, then drag to set radius. Perfect for round landing pads.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Pentagon className="size-5 text-indigo-600" />
                  <p className="font-medium">Polygon (for Fields/Land)</p>
                </div>
                <p className="text-sm text-gray-600">
                  Click multiple points to create custom shapes. Click first point again to close.
                </p>
              </div>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1766284808498-683377a6c40b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWxpY29wdGVyJTIwbGFuZGluZyUyMHBhZHxlbnwxfHx8fDE3Njc1NDU2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Helipad landing pad"
              className="w-full h-48 object-cover rounded-lg mt-4 ml-8"
            />
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Set Site Details
            </h3>
            <ul className="text-sm text-gray-700 ml-8 space-y-1">
              <li>• Site name and description</li>
              <li>• Site type (Private Land, Helipad, Vertiport, etc.)</li>
              <li>• Height AGL (Above Ground Level) for helipads/vertiports, if applicable</li>
              <li>• Validity period (start/end dates)</li>
              <li>• Contact information</li>
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
              Configure Booking Options
            </h3>
            <div className="ml-8 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="size-5 text-green-600" />
                  <p className="font-medium text-green-900">Auto-Approve</p>
                </div>
                <p className="text-sm text-green-800">
                  Bookings are automatically approved. Great for high-availability sites. You can still reject later if needed.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="size-5 text-blue-600" />
                  <p className="font-medium text-blue-900">Manual Approval (Recommended)</p>
                </div>
                <p className="text-sm text-blue-800">
                  You review each request before approving. Full control over who uses your site and when.
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="size-5 text-purple-600" />
                  <p className="font-medium text-purple-900">Exclusive Use</p>
                </div>
                <p className="text-sm text-purple-800">
                  Only one TOAL booking allowed at a time. Emergency and Recovery site selections are still permitted (they don't conflict).
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
              Enable Emergency and Recovery Site (Optional)
            </h3>
            <p className="text-sm text-gray-700 ml-8 mb-2">
              Check "Enable Emergency and Recovery Site" if you want operators to be able to select your site as an emergency backup. Remember: Emergency and Recovery sites are informational only and doesn't require your approval.
            </p>
          </div>
        </div>
      </div>

      {/* Document Requirements */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="size-6 text-purple-600" />
          <h2>Required Documents for Verification</h2>
        </div>
        <p className="text-gray-700 mb-4">
          To verify your site and activate it for operators, you must provide proof of ownership or authorization:
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-900 mb-2 flex items-center gap-2">
              <Check className="size-5" />
              Accepted Documents
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Property title deeds</li>
              <li>✓ Lease agreements</li>
              <li>✓ Land registry documents</li>
              <li>✓ Letter of authorization from owner</li>
              <li>✓ Planning permission (for helipads/vertiports)</li>
              <li>✓ Insurance certificate (recommended)</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-900 mb-2 flex items-center gap-2">
              <XCircle className="size-5" />
              NOT Accepted
            </h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>✗ Utility bills</li>
              <li>✗ Personal ID only</li>
              <li>✗ Verbal permission</li>
              <li>✗ Expired documents</li>
              <li>✗ Documents for different property</li>
            </ul>
          </div>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1654931799020-ce7cf3f4a2c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N1bWVudCUyMGNoZWNrbGlzdHxlbnwxfHx8fDE3Njc1NDU2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Document checklist"
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      {/* Managing Booking Requests */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="size-6 text-green-600" />
          <h2>Managing Booking Requests</h2>
        </div>
        <p className="text-gray-700 mb-4">
          When operators request to book your TOAL site, you'll receive a notification. Here's how to manage them:
        </p>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="flex items-center gap-2 mb-2">
              <ThumbsUp className="size-5 text-green-600" />
              Approving Requests
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              Review the operator's details (Flyer ID, mission intent, time window) and click "Approve". This issues a consent certificate and confirms the booking.
            </p>
            <p className="text-sm text-green-700 font-medium">
              ✓ You'll receive payment once the booking is complete
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="flex items-center gap-2 mb-2">
              <ThumbsDown className="size-5 text-red-600" />
              Rejecting Requests
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              If a request doesn't suit you (timing, mission type, etc.), click "Reject" and optionally provide a reason. The operator will be notified.
            </p>
            <p className="text-sm text-red-700 font-medium">
              ✓ No penalty for rejecting requests
            </p>
          </div>
        </div>
      </div>

      {/* Emergency and Recovery Site Notifications - What to Do */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="size-6 text-blue-600" />
          <h2>Emergency and Recovery Site Notifications - What to Do</h2>
        </div>
        <p className="text-gray-700 mb-4">
          When you receive an emergency and recovery site notification, it means an operator has selected your site as a backup emergency landing zone.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-blue-900 mb-3">What Happens Next:</h3>
          <div className="space-y-3 text-blue-800 text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>
              <div>
                <p className="font-medium">No Action Required (95% of cases)</p>
                <p>The operator completes their flight safely. The site is never used. Nothing happens.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>
              <div>
                <p className="font-medium">Emergency Landing (5% of cases)</p>
                <p>Operator experiences technical issues and must land at your Emergency and Recovery site. You may see a drone on your property. Contact the operator using details in your notification.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-900 font-medium mb-2">✓ If Emergency Landing Occurs:</p>
          <ul className="text-sm text-green-800 space-y-1">
            <li>1. Do not touch or move the drone</li>
            <li>2. Contact the operator using provided details</li>
            <li>3. Operator will arrange retrieval within 24 hours</li>
            <li>4. You may receive compensation for actual site use</li>
          </ul>
        </div>
      </div>

      {/* Safety Instructions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="size-6 text-red-600" />
          <h2>Safety Instructions</h2>
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
                <span>Keep the landing area clear of debris</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Notify operators of any hazards (power lines, trees)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Update site status if conditions change</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Use "Temporarily Restricted" if maintenance needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Maintain clear communication with operators</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Keep documents up to date</span>
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
                <span>Never approach a drone while rotors are spinning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never approve bookings for property you don't own/control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never touch or move a landed drone (emergency or otherwise)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never block emergency and recovery site access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never leave site active if unsafe conditions exist</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Never share your login credentials</span>
              </li>
            </ul>
          </div>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1761576660182-3f05ccc5a61d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWZldHklMjB3YXJuaW5nJTIwc2lnbnxlbnwxfHx8fDE3Njc1NDU2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Safety warning sign"
          className="w-full h-48 object-cover rounded-lg mt-4"
        />
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-green-900 mb-4">💡 Quick Tips for Success</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
          <div>
            <p className="font-medium mb-1">📍 Accurate Geometry</p>
            <p>Draw your site boundaries precisely to avoid disputes</p>
          </div>
          <div>
            <p className="font-medium mb-1">⚡ Auto-Approve for Higher Revenue</p>
            <p>Sites with auto-approve get booked 3x more often</p>
          </div>
          <div>
            <p className="font-medium mb-1">📅 Keep Sites Active</p>
            <p>Inactive sites don't appear in operator searches</p>
          </div>
          <div>
            <p className="font-medium mb-1">💬 Respond Quickly</p>
            <p>Fast responses lead to better operator ratings</p>
          </div>
          <div>
            <p className="font-medium mb-1">🛡️ Enable Emergency and Recovery for Visibility</p>
            <p>Emergency and Recovery enabled sites get more exposure to operators</p>
          </div>
          <div>
            <p className="font-medium mb-1">📊 Monitor Analytics</p>
            <p>Check your revenue and booking trends regularly</p>
          </div>
        </div>
      </div>

      {/* Ready to Start */}
      <div className="bg-indigo-600 rounded-lg p-8 text-center">
        <h2 className="text-white mb-4">Ready to Create Your First TOAL Site?</h2>
        <button
          onClick={onCreateSite}
          className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium inline-flex items-center gap-2"
        >
          <Plus className="size-5" />
          Add New TOAL Site
        </button>
      </div>
    </div>
  );
}