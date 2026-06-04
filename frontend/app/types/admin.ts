export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  account_status: 'pending' | 'approved' | 'rejected' | 'blocked' | string;
  student_id_url?: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  description: string;
}
