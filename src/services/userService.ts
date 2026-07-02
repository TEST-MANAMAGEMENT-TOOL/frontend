import axios from 'axios';
import { backend_url } from '@/config';
import { User, CreateUserData, UpdateUserData, roleMap, roleIdToName } from '@/types/user';

export type { User, CreateUserData, UpdateUserData };

const API_BASE_URL = backend_url;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.log('No token found in localStorage');
    return {};
  }
  
  // Token should already be stored with "Bearer " prefix from authService.setToken()
  // But ensure it's properly formatted just in case
  const cleanToken = token.replace(/^Bearer\s*/i, '');
  const formattedToken = `Bearer ${cleanToken}`;
  
  console.log('Token formatting check:', {
    hasBearer: token.startsWith('Bearer '),
    formatted: `${formattedToken.substring(0, 20)}...`,
    isValid: !!cleanToken
  });
  
  return { Authorization: formattedToken };
};

export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/getuserdetails`, {}, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      console.log('Get users response:', response.data);

      const users = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.users)
          ? response.data.users
        : Array.isArray(response.data)
          ? response.data
          : [];

      if (users.length > 0) {
        return users.map((user: any) => {
          const fullname = user.fullname || user.full_name || user.name || '';
          const nameParts = fullname.trim().split(/\s+/).filter(Boolean);

          return {
            id: user.id?.toString() || user._id?.toString() || user.userid?.toString() || user.user_id?.toString(),
            firstName: user.firstName || user.first_name || nameParts[0] || '',
            lastName: user.lastName || user.last_name || nameParts.slice(1).join(' ') || '',
            username: user.username || user.email?.split('@')[0] || '',
            email: user.email || '',
            role: roleIdToName[user.role] || user.role || user.rolename || 'Developer',
            phone: user.phone || '',
            isEmailVerified: user.isEmailVerified || user.email_verified || false,
            createdAt: user.createdAt || user.created_at,
            updatedAt: user.updatedAt || user.updated_at
          };
        });
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Get single user
  async getUser(id: string): Promise<User> {
    try {
      console.log(`[userService] Fetching user ${id} from list fallback`);
      const allUsers = await this.getUsers();
      const user = allUsers.find(u => String(u.id) === String(id));
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      return user;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      throw new Error(error.message || 'Failed to fetch user');
    }
  },

  // Create user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/register`,
        {
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || '',
          role: roleMap[userData.role] || '3'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          }
        }
      );

      console.log('Create user response:', response.data);
      const user = response.data?.data || response.data;
      
      return {
        id: user.id?.toString() || user._id,
        firstName: user.firstName || userData.firstName,
        lastName: user.lastName || userData.lastName,
        username: user.username || userData.username,
        email: user.email || userData.email,
        role: userData.role,
        phone: user.phone || userData.phone
      };
    } catch (error: any) {
      console.error('Error creating user:', error);
      const message = error.response?.data?.message;
      if (typeof message === 'object') {
        const firstError = Object.values(message)[0];
        throw new Error(firstError as string || 'Failed to create user');
      }
      throw new Error(message || 'Failed to create user');
    }
  },

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      let existingUser: User | null = null;
      try {
        const allUsers = await this.getUsers();
        existingUser = allUsers.find(u => String(u.id) === String(id)) || null;
      } catch (err) {
        console.warn('Failed to fetch user list for update lookup:', err);
      }

      const email = userData.email || existingUser?.email;
      if (!email) {
        throw new Error('User email is required to update details on the cloud backend.');
      }

      const phone = userData.phone !== undefined ? userData.phone : (existingUser?.phone || '');
      const roleText = userData.role || existingUser?.role || 'Developer';
      const roleVal = roleMap[roleText] || roleText || '3';

      const firstName = userData.firstName || existingUser?.firstName || '';
      const lastName = userData.lastName || existingUser?.lastName || '';
      const fullname = `${firstName} ${lastName}`.trim() || email.split('@')[0];

      const payload = {
        email,
        phone,
        role: roleVal,
        fullname
      };

      console.log(`[userService] Updating user ${id} via POST /updateuserdetails:`, payload);

      const response = await axios.post(
        `${API_BASE_URL}/updateuserdetails`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          }
        }
      );

      console.log('Update user response:', response.data);

      return {
        id: id,
        firstName: firstName,
        lastName: lastName,
        username: existingUser?.username || email.split('@')[0] || '',
        email: email,
        role: roleText,
        phone: phone
      };
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    throw new Error('User deletion is not supported by the backend API');
  },

  // Update user role
  async updateUserRole(id: string, role: string): Promise<User> {
    return this.updateUser(id, { role });
  },

  // Get current user details
  async getUserDetails(): Promise<User> {
    try {
      // Check if we have a token first
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Making getUserDetails request to direct API...');
      
      // Use direct API endpoint like the Postman request
      const response = await axios.post(
        'https://kiwamitestcloud.com/dashboardapis/api/getuserdetails',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          timeout: 15000,
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        }
      );

      console.log('Get user details response:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data
      });
      
      // Handle 401 specifically
      if (response.status === 401) {
        console.error('❌ getUserDetails returned 401 - Authentication failed');
        throw new Error('Unauthenticated. Please log in again.');
      }
      
      // Handle other error status codes
      if (response.status >= 400) {
        const errorMessage = response.data?.message || `HTTP ${response.status}: Failed to fetch user details`;
        console.error('❌ getUserDetails failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const user = response.data?.data || response.data;
      console.log('Raw user data from API:', user);

      // Parse fullname into firstName and lastName
      const fullname = user.fullname || '';
      const nameParts = fullname.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Special handling for specific email to ensure Super Admin role
      let userRole = user.rolename || roleIdToName[user.role] || user.role || 'Developer';
      console.log('Original role from API:', userRole);
      console.log('User email:', user.email);
      
      // Ensure nyamaibigjoash@gmail.com shows as Super Admin
      if (user.email === 'nyamaibigjoash@gmail.com') {
        console.log('Applying Super Admin role for nyamaibigjoash@gmail.com');
        userRole = 'Super Admin';
      } else if (userRole === 'Superadmin') {
        console.log('Converting Superadmin to Super Admin');
        userRole = 'Super Admin';
      }

      console.log('Final mapped role:', userRole);

      const mappedUser = {
        id: user.id?.toString() || user._id || user.userid || '',
        firstName: firstName,
        lastName: lastName,
        username: user.username || user.email?.split('@')[0] || '',
        email: user.email || '',
        role: userRole,
        phone: user.phone || '',
        isEmailVerified: user.status === 'Active' || user.isEmailVerified || false,
        createdAt: user.created_at || user.createdAt,
        updatedAt: user.updated_at || user.updatedAt
      };

      console.log('Final mapped user object:', mappedUser);
      return mappedUser;
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthenticated. Please log in again.');
      }
      
      // If direct API fails, try fallback with original API client
      console.log('Direct API failed, trying fallback with original API client...');
      try {
        const response = await axios.post(
          `${API_BASE_URL}/getuserdetails`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader()
            }
          }
        );

        console.log('Fallback API response:', response.data);
        const user = response.data?.data || response.data;

        // Parse fullname into firstName and lastName
        const fullname = user.fullname || '';
        const nameParts = fullname.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Handle role mapping
        let userRole = user.rolename || roleIdToName[user.role] || user.role || 'Developer';
        if (user.email === 'nyamaibigjoash@gmail.com') {
          userRole = 'Super Admin';
        } else if (userRole === 'Superadmin') {
          userRole = 'Super Admin';
        }

        const mappedUser = {
          id: user.id?.toString() || user._id || user.userid || '',
          firstName: firstName,
          lastName: lastName,
          username: user.username || user.email?.split('@')[0] || '',
          email: user.email || '',
          role: userRole,
          phone: user.phone || '',
          isEmailVerified: user.status === 'Active' || user.isEmailVerified || false,
          createdAt: user.created_at || user.createdAt,
          updatedAt: user.updated_at || user.updatedAt
        };

        return mappedUser;
      } catch (fallbackError: any) {
        console.error('Fallback API also failed:', fallbackError);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user details');
      }
    }
  }
};
