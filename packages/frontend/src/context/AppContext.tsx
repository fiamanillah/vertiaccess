import { createContext, useContext, ReactNode } from 'react';
import type { User } from '../App';
import type { Site, PendingVerification, BookingRequest } from '../types';

interface AppContextType {
  currentUser: User | null;
  allSites: Site[];
  allBookings: BookingRequest[];
  pendingVerifications: PendingVerification[];
  siteApprovalNotifications: SiteApprovalNotification[];
  handleLogin: (user: User) => void;
  handleLogout: () => void;
  handleUpdateUser: (user: User) => void;
  handleAddSite: (site: Site) => void;
  handleUpdateSite: (site: Site) => void;
  handleAddPendingVerification: (v: PendingVerification) => void;
  handleRemovePendingVerification: (id: string) => void;
  handleUpdateVerificationStatus: (id: string, status: 'approved' | 'rejected') => void;
  handleUpdateBookingStatus: (id: string, status: BookingRequest['status']) => void;
  handleClearSiteNotification: (id: string) => void;
}

export interface SiteApprovalNotification {
  siteId: string;
  siteName: string;
  approved: boolean;
  timestamp: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, value }: { children: ReactNode; value: AppContextType }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
