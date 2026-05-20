import { type AdminUser } from '@/services/admin.service';

export type TUser = AdminUser & {
  avatarUrl?: string;
};
