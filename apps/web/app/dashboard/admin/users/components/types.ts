export type TUser = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  avatarUrl?: string;
  instagramUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
};
