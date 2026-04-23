# Operator Dashboard Components - Analysis & Recommendations

## 1. Sub-Components Overview

### Component Structure

```
OperatorDashboard (main component)
├── OperatorBookingsSection
├── OperatorCLZSection
├── OperatorCertificatesSection
└── OperatorIncidentsSection
```

All components are located in `/src/components/operator-dashboard/`

---

## 2. Component Details & Data Fetching

### 2.1 OperatorBookingsSection.tsx (14 KB, ~200 lines)

**Purpose**: Display user's flight operation bookings in a table format

**Data Displayed**:

- Site name and operator ID
- Booking window (start/end dates and times)
- Operation reference number (booking ID)
- Infrastructure type (TOAL vs Emergency & Recovery)
- Booking status (APPROVED, PENDING, CANCELLED)
- Action buttons (View details, Pay, Cancel, Report incident)

**Data Source**:

- `bookings: BookingRequest[]` array from dashboard state
- Filters and maps data from `apiFetchMyBookings()` via `useOperatorDashboardState`

**Props**:

```typescript
interface OperatorBookingsSectionProps {
    bookings: BookingRequest[];
    isLoading: boolean;
    isCancellingLoading: boolean;
    isPayingBooking: boolean;
    onSelectBookingDetails: (booking: BookingRequest) => void;
    onSelectReceipt: (booking: BookingRequest) => void;
    onSetBookingToCancel: (booking: BookingRequest) => void;
    onReportIncident: (booking: BookingRequest) => void;
}
```

---

### 2.2 OperatorCLZSection.tsx (12 KB, ~250 lines)

**Purpose**: Display Emergency & Recovery (CLZ = Congested/Low-level Zone) selections

**Data Displayed**:

- Site name and selection timestamp
- Operation dates and times
- Drone model, flyer ID, mission intent
- Usage confirmation state (Used/Not used/Pending)
- Pricing information (total cost)
- Error messages for failed confirmations
- Operation window status (closed/active)

**Data Source**:

- `clzSelections: CLZSelection[]` array derived from bookings with `useCategory === 'emergency_recovery'`
- Extracted and transformed in `loadBookings()` via `useOperatorDashboardState`

**Props**:

```typescript
interface OperatorCLZSectionProps {
    clzSelections: CLZSelection[];
    isPayingClz: Record<string, boolean>; // Loading state per selection
    onConfirmUsage: (selection: CLZSelection, used: boolean) => Promise<void>;
    onRemove: (id: string) => void;
}
```

---

### 2.3 OperatorCertificatesSection.tsx (3.8 KB, ~100 lines)

**Purpose**: Display digital consent certificates (proof of landowner approval)

**Data Displayed**:

- Certificate reference ID (truncated to 13 chars)
- Site name and address
- Consent certificate icon
- Issue date
- Booking reference/operation reference
- View full certificate button
- Download button

**Data Source**:

- `certificates: ConsentCertificate[]` array
- Fetched alongside bookings as part of initial dashboard load
- Currently mapping not explicitly shown in `useOperatorDashboardState` (appears to be pre-populated or derived)

**Props**:

```typescript
interface OperatorCertificatesSectionProps {
    certificates: ConsentCertificate[];
    onSelectCertificate: (cert: ConsentCertificate) => void;
}
```

**Empty State**: Displays "No certificates issued yet" message with icon when array is empty

---

### 2.4 OperatorIncidentsSection.tsx (6.5 KB, ~120 lines)

**Purpose**: Display safety incident reports for audit and tracking

**Data Displayed**:

- Case ID (incident identifier)
- Site name and booking ID
- Incident type (displayed with underscores replaced with spaces)
- Incident date/time
- Status (UNDER_REVIEW, RESOLVED, OPEN) with color coding
- View Report action button

**Data Source**:

- `incidentReports: IncidentReport[]` array
- Fetched via `apiFetchIncidents()` and transformed with `apiIncidentToFrontendIncident()`
- Managed in `useOperatorDashboardState`

**Props**:

```typescript
interface OperatorIncidentsSectionProps {
    incidents: IncidentReport[];
    onSelectIncident: (incident: IncidentReport) => void;
}
```

**Empty State**: Displays "No Safety Incidents Logged" message with icon when array is empty

---

## 3. Current Loading State Handling

### ✅ Implemented: OperatorBookingsSection

**Loading Indicator**: Skeleton loader UI

```typescript
{isLoading ? (
    <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
            <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                <Skeleton className="size-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32 opacity-50" />
                </div>
                <Skeleton className="h-4 w-24 mx-4" />
                <Skeleton className="h-4 w-24 mx-4" />
                <Skeleton className="h-8 w-8 rounded-lg shrink-0 ml-auto" />
            </div>
        ))}
    </div>
) : (
    // Table content
)}
```

**Component Loading Prop**: `isLoading` boolean (combined: `bookingsLoading || isLoading`)

**Action Loading States**:

- `isCancellingLoading` - disables cancel operations
- `isPayingBooking` - disables payment operations
- Buttons disabled during loading with `disabled:opacity-50`

---

### ❌ Missing: OperatorCLZSection

**Current Behavior**:

- No loading skeleton UI
- Displays CLZ selections immediately when component mounts
- Shows empty state implicitly (no items rendered)
- Has action-level loading states (`isPayingClz` record) but no section-level loading indicator

**Action Loading States**:

- `isPayingClz: Record<string, boolean>` - per-selection loading state
- ✅ Button disabled during processing: `disabled={isProcessing}`

**Gap**: No initial data loading skeleton or placeholder

---

### ❌ Missing: OperatorCertificatesSection

**Current Behavior**:

- No loading skeleton UI
- Displays certificates immediately
- Shows empty state message: "No certificates issued yet"
- No loading prop received from parent

**Gap**:

- No way to distinguish between "loading" vs "no certificates"
- No initial loading indicator when component mounts
- Certificate cards don't animate in during load

---

### ❌ Missing: OperatorIncidentsSection

**Current Behavior**:

- No loading skeleton UI
- Displays either empty state or full table
- Shows placeholder: "No Safety Incidents Logged"
- No loading prop received from parent

**Gap**:

- No way to distinguish between "loading" vs "no incidents"
- No initial loading indicator during API fetch
- No skeleton loader for table rows

---

## 4. Existing Skeleton & Loader Components

### Skeleton Component

**Location**: `/src/components/ui/skeleton.tsx`

**Implementation**:

```typescript
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-blue-600/10 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}
```

**Features**:

- Uses `animate-pulse` from Tailwind for animation
- Light blue background (`bg-blue-600/10`)
- Rounded corners by default
- Accepts custom className for sizing

**Current Usage**:

- ✅ `OperatorBookingsSection.tsx` - 5 skeleton rows (lines 59-66)
- ❌ Not used elsewhere in operator dashboard

### Loader Icons

**Source**: lucide-react package (`Loader` and `Loader2` icons)

**Current Usage**:

- ✅ `OperatorCLZSection.tsx` (lines 161, 177) - spinning loader in buttons during confirmation
- ✅ Various modals and forms across codebase
- ❌ Not used for section-level loading indicators

---

## 5. Loading State Management in useOperatorDashboardState

### Dashboard-Level Loading States

```typescript
const [bookingsLoading, setBookingsLoading] = useState(true); // Initial: true
const [incidentsLoading, setIncidentsLoading] = useState(true); // Initial: true
const [notificationsLoading, setNotificationsLoading] = useState(true); // Initial: true
const [isPaymentCardLoading, setIsPaymentCardLoading] = useState(true); // Initial: true
```

### Data Loading Functions

All wrapped in try-finally to ensure loading state is cleared:

```typescript
const loadBookings = useCallback(async () => {
    if (!idToken) return;
    try {
        setBookingsLoading(true);
        const apiBookings = await apiFetchMyBookings(idToken);
        const mappedBookings = apiBookings.map(apiBookingToFrontend);
        setBookings(mappedBookings);
        // Also populates clzSelections from mapped bookings
    } catch (err) {
        console.error('Failed to load bookings:', err);
    } finally {
        setBookingsLoading(false);
    }
}, [idToken]);

const loadIncidents = useCallback(async () => {
    if (!idToken) return;
    try {
        setIncidentsLoading(true);
        const apiIncidents = await apiFetchIncidents(idToken);
        setIncidentReports(apiIncidents.map(apiIncidentToFrontendIncident));
    } catch (error) {
        console.error('Failed to load incidents:', error);
    } finally {
        setIncidentsLoading(false);
    }
}, [idToken]);
```

### Issue: Certificate Loading Not Implemented

- `certificates` state exists but loading state `certificatesLoading` is **not defined**
- No clear data source for certificates (not explicitly loaded in hook)

---

## 6. Component Render Flow

### OperatorDashboard Renders Sections Based on View

```typescript
<div className="min-h-100">
    {view === 'bookings' && (
        <OperatorBookingsSection
            bookings={bookings}
            isLoading={bookingsLoading || isLoading}  // ✅ Loading state passed
            // ... more props
        />
    )}

    {view === 'clz' && (
        <OperatorCLZSection
            clzSelections={clzSelections}
            isPayingClz={isPayingClz}
            // ❌ NO isLoading prop passed
            // ...
        />
    )}

    {view === 'certificates' && (
        <OperatorCertificatesSection
            certificates={certificates}
            // ❌ NO isLoading prop passed
            // ...
        />
    )}

    {view === 'incidents' && (
        <OperatorIncidentsSection
            incidents={incidentReports}
            // ❌ NO isLoading prop passed
            // ...
        />
    )}
</div>
```

---

## 7. Recommendations for Skeleton Loaders

### 🔴 High Priority

#### 1. Add Loading State to OperatorCertificatesSection

**Current Issue**: No way to distinguish between "loading certificates" vs "no certificates issued"

**Recommendation**:

- Add `isLoading?: boolean` prop
- Create skeleton loader for certificate grid (2 columns)
- Show 2-4 skeleton cards while loading
- Pass `certificatesLoading` state from parent

**Implementation Example**:

```typescript
{isLoading ? (
    <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                    <Skeleton className="size-12 rounded-xl" />
                    <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <div className="flex gap-2 mb-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="flex-1 h-10 rounded-lg" />
                    <Skeleton className="size-10 rounded-lg" />
                </div>
            </div>
        ))}
    </div>
) : (
    // Existing certificate grid
)}
```

#### 2. Add Loading State to OperatorIncidentsSection

**Current Issue**: Table instantly shows "No Safety Incidents Logged" even during data fetch

**Recommendation**:

- Add `isLoading?: boolean` prop
- Create skeleton loader for table rows (5-6 rows)
- Show skeleton rows while loading
- Display "No incidents" only when loaded AND array is empty

**Implementation Example**:

```typescript
{isLoading ? (
    <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
            {/* existing header */}
        </thead>
        <tbody className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-20" /></td>
                </tr>
            ))}
        </tbody>
    </table>
) : incidents.length === 0 ? (
    // Existing empty state
) : (
    // Existing table content
)}
```

### 🟡 Medium Priority

#### 3. Add Loading State to OperatorCLZSection

**Current Issue**: Section appears empty while loading CLZ selections

**Recommendation**:

- Add `isLoading?: boolean` prop
- Create skeleton loader for CLZ cards
- Show 1-2 skeleton cards while loading
- Pass `bookingsLoading` state (CLZ selections derived from bookings)

**Implementation Example**:

```typescript
{isLoading ? (
    <div className="space-y-6">
        {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="size-11 rounded-xl shrink-0" />
                        <div className="flex-1">
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-16 w-full rounded-3xl" />
            </div>
        ))}
    </div>
) : (
    // Existing CLZ content
)}
```

### 🟢 Lower Priority

#### 4. Enhance OperatorBookingsSection Skeleton

**Current State**: ✅ Already has skeleton loader
**Suggestion**: Consider matching the exact table structure more closely with conditional skeleton columns for better visual correspondence

---

## 8. State Management Issues

### Issue 1: Missing Certificate Loading State

**Location**: `useOperatorDashboardState.ts`

**Problem**: No `certificatesLoading` state defined, but `loadBookings()` populates certificates

**Solution**:

```typescript
const [certificatesLoading, setCertificatesLoading] = useState(false);

// In loadBookings or new loadCertificates function
const loadCertificates = useCallback(async () => {
    if (!idToken) return;
    try {
        setCertificatesLoading(true);
        const apiCerts = await apiFetchCertificates(idToken); // Need to implement
        setCertificates(apiCerts.map(apiCertificateToFrontend));
    } catch (error) {
        console.error('Failed to load certificates:', error);
    } finally {
        setCertificatesLoading(false);
    }
}, [idToken]);
```

### Issue 2: Initial Load Synchronization

**Observation**: Loading states start as `true` but initial load happens in component mount or notification

**Current**: No explicit initial load trigger visible in OperatorDashboard component lifecycle

**Recommendation**: Verify these are being loaded on dashboard mount via `useEffect`

---

## 9. Summary Table

| Component                   | Has Loading State         | Uses Skeleton | Needs Skeleton  | Priority |
| --------------------------- | ------------------------- | ------------- | --------------- | -------- |
| OperatorBookingsSection     | ✅ Yes                    | ✅ Yes        | ✅ Already done | -        |
| OperatorCLZSection          | ⚠️ Partial (action-level) | ❌ No         | ✅ Yes          | Medium   |
| OperatorCertificatesSection | ❌ No                     | ❌ No         | ✅ Yes          | High     |
| OperatorIncidentsSection    | ❌ No                     | ❌ No         | ✅ Yes          | High     |

---

## 10. Implementation Checklist

- [ ] Add `isLoading` prop to `OperatorCertificatesSection`
- [ ] Create certificate grid skeleton (2 columns, 2-4 items)
- [ ] Add `certificatesLoading` state to `useOperatorDashboardState`
- [ ] Pass loading state from parent to certificates section
- [ ] Add `isLoading` prop to `OperatorIncidentsSection`
- [ ] Create incident table skeleton (5-6 rows)
- [ ] Add `incidentsLoading` state export (if not already) to `useOperatorDashboardState`
- [ ] Pass loading state from parent to incidents section
- [ ] Add `isLoading` prop to `OperatorCLZSection`
- [ ] Create CLZ card skeleton (1-2 items)
- [ ] Pass `bookingsLoading` state from parent to CLZ section
- [ ] Test all loading states with network slowdown
- [ ] Verify empty states only show after loading completes

---

## Files Modified Summary

### Would Need to Be Updated:

1. **operator-dashboard/OperatorCertificatesSection.tsx** - Add loading prop and skeleton
2. **operator-dashboard/OperatorIncidentsSection.tsx** - Add loading prop and skeleton
3. **operator-dashboard/OperatorCLZSection.tsx** - Add loading prop and skeleton
4. **operator-dashboard/OperatorDashboard.tsx** - Pass loading states to sections
5. **operator-dashboard/useOperatorDashboardState.ts** - Verify/add certificate loading state
