export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
  bio?: string;
  company?: string;
  profileImage?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  lastActive?: Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  _id?: string;
  phoneVerifiedDate?: Date | null;
  emailVerifiedDate?: Date | null;
  password?: string; // Only used in store for compatibility
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: string;
  phone?: string;
  location?: string;
  bio?: string;
  company?: string;
  profileImage?: string;
}

// Temporary user data for signup flow
export interface TempUserData {
  fullName: string;
  username: string;
  email: string;
  password?: string; // Made optional since we're not storing it anymore
  role: string;
  signupTimestamp: Date;
  verificationCode?: string;
}

// Role mapping (as strings for backend)
export const roleMap: Record<string, string> = {
  'Tester': '2',
  'Developer': '3',
  'Super Admin': '5',
  'Superadmin': '5'
};

export const roleIdToName: Record<string, string> = {
  '2': 'Tester',
  '3': 'Developer',
  '5': 'Super Admin'
};