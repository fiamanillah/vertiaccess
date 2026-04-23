import {
  Site,
  PendingVerification,
  IncidentReport,
  BookingRequest,
} from "../types";
import type { User } from "../App";
import * as turf from "@turf/turf";
import { generateVAID } from "../utils/idGenerator";

// Helper function to generate CLZ polygon using Turf.js buffer
const generateClzPolygon = (
  points: { lat: number; lng: number }[],
  bufferMeters: number,
) => {
  try {
    const coordinates = points.map((p) => [p.lng, p.lat]);
    coordinates.push(coordinates[0]);

    const polygon = turf.polygon([coordinates]);
    const buffered = turf.buffer(polygon, bufferMeters / 1000, {
      units: "kilometers",
    });

    if (!buffered || !buffered.geometry) return [];

    const bufferedCoords = buffered.geometry.coordinates[0];
    return bufferedCoords.slice(0, -1).map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
  } catch (error) {
    console.error("Error generating CLZ polygon:", error);
    return [];
  }
};

// Mock Users
export const mockUsers: User[] = [
  {
    id: "VA-LO-PRITH882",
    email: "landowner@demo.com",
    role: "landowner",
    organisation: "Bhundoo Aerospace Infrastructure",
    fullName: "Prithiviraj Bhundoo",
    verified: true,
    verificationStatus: "VERIFIED",
    paymentCard: {
      last4: "4242",
      brand: "Visa",
      expiryMonth: "12",
      expiryYear: "2026",
      addedAt: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "VA-OP-JENN991",
    email: "operator@demo.com",
    role: "operator",
    organisation: "AeroSurvey UK Ltd",
    verified: true,
    verificationStatus: "VERIFIED",
    flyerId: "GBR-RPAS-20241",
    operatorId: "VA-OP-JENN991",
    paymentCard: {
      last4: "5555",
      brand: "Mastercard",
      expiryMonth: "08",
      expiryYear: "2027",
      addedAt: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "VA-ADMIN-001",
    email: "admin@utm.gov.uk",
    role: "admin",
    verified: true,
    verificationStatus: "VERIFIED",
    organisation: "UK Civil Aviation Authority",
  },
];

export const mockSites: Site[] = [
  {
    id: "VA-SITE-CTC88291",
    landownerId: "VA-LO-PRITH882",
    landownerName: "Prithiviraj Bhundoo",
    name: "CTC",
    siteType: "toal",
    siteCategory: "helipad",
    address: "103 Nautilus Apts, London",
    postcode: "SE1 7AA",
    contactEmail: "landowner@demo.com",
    contactPhone: "+447766614158",
    geometry: {
      type: "circle",
      center: { lat: 51.5074, lng: -0.1278 },
      radius: 25,
      heightAGL: 2,
    },
    emergencyRecoveryEnabled: true,
    clzEnabled: true,
    clzGeometry: {
      type: "circle",
      center: { lat: 51.5074, lng: -0.1278 },
      radius: 75,
    },
    validityStart: "2026-02-12T00:00:00Z",
    autoApprove: false,
    exclusiveUse: true,
    status: "ACTIVE",
    siteInformation: "Premium rooftop helipad overlooking the Thames.",
    documents: [],
    createdAt: "2026-02-11T10:00:00Z",
  },
  {
    id: "VA-SITE-HAM00123",
    landownerId: "VA-LO-PRITH882",
    landownerName: "Prithiviraj Bhundoo",
    name: "Hampshire Farm North Field",
    siteType: "toal",
    siteCategory: "private_land",
    address: "North Field Access Road, Winchester, Hampshire, SO24 9QE",
    postcode: "SO24 9QE",
    contactEmail: "operations@hampshirefarm.co.uk",
    contactPhone: "+44 1962 840123",
    geometry: {
      type: "circle",
      center: { lat: 51.0657, lng: -1.308 },
      radius: 60,
      heightAGL: 2,
    },
    clzGeometry: {
      type: "circle",
      center: { lat: 51.0657, lng: -1.308 },
      radius: 180,
    },
    validityStart: "2024-01-15T00:00:00Z",
    autoApprove: false,
    exclusiveUse: false,
    emergencyRecoveryEnabled: true,
    clzEnabled: true,
    status: "ACTIVE",
    documents: [],
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "VA-SITE-SKY99102",
    landownerId: "VA-LO-PRITH882",
    landownerName: "Prithiviraj Bhundoo",
    name: "SkyPort Central Rooftop",
    siteType: "toal",
    siteCategory: "helipad",
    address: "Financial District, London",
    postcode: "EC2M 2RB",
    contactEmail: "rooftop@skyport-london.co.uk",
    contactPhone: "+44 20 7123 9999",
    geometry: {
      type: "circle",
      center: { lat: 51.5144, lng: -0.0828 },
      radius: 30,
      heightAGL: 45,
    },
    emergencyRecoveryEnabled: true,
    clzEnabled: true,
    clzGeometry: {
      type: "circle",
      center: { lat: 51.5144, lng: -0.0828 },
      radius: 100,
    },
    validityStart: "2026-01-01T00:00:00Z",
    status: "ACTIVE",
    documents: [],
    createdAt: "2026-01-01T10:00:00Z",
  },
];

export const mockBookingRequests: BookingRequest[] = [
  {
    id: "VA-BKG-88291042",
    siteId: "VA-SITE-HAM00123",
    siteName: "Hampshire Farm North Field",
    operatorId: "VA-OP-JENN991",
    operatorEmail: "operator@demo.com",
    operatorOrganisation: "AeroSurvey UK Ltd",
    startTime: "2026-02-20T09:00:00",
    endTime: "2026-02-20T12:00:00",
    operationReference: "VA-BKG-88291042",
    droneModel: "DJI Mavic 3 Enterprise",
    flyerId: "GBR-RPAS-20241",
    missionIntent: "Agricultural survey",
    status: "APPROVED",
    toalCost: 50.0,
    platformFee: 0,
    createdAt: "2026-02-15T10:30:00Z",
  },
  {
    id: "VA-BKG-99102837",
    siteId: "VA-SITE-SKY99102",
    siteName: "SkyPort Central Rooftop",
    operatorId: "VA-OP-JENN991",
    operatorEmail: "operator@demo.com",
    operatorOrganisation: "AeroSurvey UK Ltd",
    startTime: "2026-02-25T14:30:00",
    endTime: "2026-02-25T15:30:00",
    operationReference: "VA-BKG-99102837",
    droneModel: "Freefly Alta X",
    flyerId: "GBR-RPAS-20241",
    missionIntent: "Cinema production backup",
    status: "PENDING",
    toalCost: 50.0,
    platformFee: 0,
    createdAt: "2026-02-15T11:00:00Z",
  },
];

export const mockPendingVerifications: PendingVerification[] = [
  {
    id: "VA-CERT-ARKW001",
    type: "landowner",
    userId: "VA-LO-ARKW001",
    userName: "Jonathan Arkwright",
    userEmail: "j.arkwright@peak-estates.co.uk",
    userOrganisation: "Peak District Estates Ltd",
    createdAt: "2026-02-11T10:30:00Z",
    documents: ["Government_ID_Jonathan.pdf"],
    status: "PENDING",
  },
  {
    id: "VA-CERT-VANCE02",
    type: "landowner",
    userId: "VA-LO-VANCE02",
    userName: "Elara Vance",
    userEmail: "elara.vance@vance-rural.com",
    userOrganisation: "Vance Rural Property Management",
    createdAt: "2026-02-12T08:45:00Z",
    documents: ["Passport_Elara_Vance.jpg"],
    status: "PENDING",
  },
  {
    id: "VA-CERT-OP-PRITH",
    type: "operator",
    userId: "VA-OP-PRITH882",
    userName: "Prithiviraj Bhundoo",
    userEmail: "akshavaariz@gmail.com",
    userOrganisation: "Bhundoo Aerospace Infrastructure",
    flyerId: "GBR-RPAS-20241",
    createdAt: "2026-02-14T10:30:00Z",
    documents: ["CAA_Operator_Certificate.pdf"],
    status: "PENDING",
  },
  {
    id: "VA-CERT-SITE-001",
    type: "site",
    siteId: "VA-SITE-CTC88291",
    siteName: "CTC Rooftop Helipad",
    siteAddress: "103 Nautilus Apts, London SE1 7AA",
    userName: "Prithiviraj Bhundoo",
    userEmail: "landowner@demo.com",
    userOrganisation: "Bhundoo Aerospace Infrastructure",
    createdAt: "2026-02-15T14:20:00Z",
    documents: [
      "Site_Layout_Map.png",
      "Emergency_Access_Protocol.pdf",
      "Land_Registry_Proof.pdf",
    ],
    status: "PENDING",
  },
];

export const mockIncidentReports: IncidentReport[] = [
  {
    id: "VA-INC-77281901",
    landownerId: "VA-LO-PRITH882",
    landownerName: "Prithiviraj Bhundoo",
    siteId: "VA-SITE-HAM00123",
    siteName: "Hampshire Farm North Field",
    bookingId: "VA-BKG-88291042",
    operatorId: "VA-OP-JENN991",
    operatorName: "Jennifer Clarke",
    type: "breach_of_conditions",
    description:
      "Operator flew outside of permitted window and entered restricted area near farmhouse.",
    urgency: "high",
    status: "OPEN",
    createdAt: "2026-02-15T14:30:00Z",
    incidentDateTime: "2026-02-15T11:45:00Z",
  },
  {
    id: "VA-INC-88123456",
    landownerId: "VA-LO-PRITH882",
    landownerName: "Prithiviraj Bhundoo",
    siteId: "VA-SITE-CTC88291",
    siteName: "CTC Rooftop",
    bookingId: "VA-BKG-99102837",
    operatorId: "VA-OP-JENN991",
    operatorName: "Jennifer Clarke",
    type: "damage_observed",
    description: "Minor scuffing on the helipad surface after hard landing.",
    urgency: "medium",
    status: "UNDER_REVIEW",
    createdAt: "2026-02-14T09:00:00Z",
    incidentDateTime: "2026-02-13T16:20:00Z",
  },
];
