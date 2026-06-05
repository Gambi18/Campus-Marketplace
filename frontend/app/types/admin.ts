export interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_verified: boolean;
  account_status: 'pending' | 'approved' | 'rejected' | 'blocked' | string;
  student_id_url?: string;
}

export interface PlatformAdmin {
  id: string;
  username: string;
  email: string;
  created_at?: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  description: string;
}
