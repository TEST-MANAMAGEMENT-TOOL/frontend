import React, { useState, useEffect, useRef } from "react";
import {
  Edit,
  Mail,
  User as UserIcon,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  EyeOff,
  Globe,
  Check,
  Upload,
  Trash2,
  Lock,
  Unlock,
  ChevronRight,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  Languages,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { userService } from "@/services/userService";
import { User } from "@/types/user";

const Profile = () => {
  const { currentUser, updateCurrentUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || "");
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "",
    bio: currentUser?.bio || "",
    company: currentUser?.company || "",
    password: "",
    language: "English",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  // Initialize user details from localStorage on component mount
  useEffect(() => {
    const initializeUserDetails = () => {
      // First check if user details are already in the store
      if (currentUser) {
        console.log('User details already in store:', currentUser);
        return;
      }
      
      // Try to load user details from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Loading user details from localStorage:', userData);
          updateCurrentUser(userData);
          return;
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
        }
      }
      
      // If no stored user details and we have a token, fetch them
      const token = localStorage.getItem('token');
      if (token) {
        console.log('No stored user details found, fetching from API...');
        fetchUserDetailsFromAPI();
      } else {
        console.log('No token found, redirecting to login...');
        window.location.href = '/login';
      }
    };

    const fetchUserDetailsFromAPI = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching user details from API...');
        const userDetails = await userService.getUserDetails();
        console.log('✅ User details fetched successfully:', userDetails);
        updateCurrentUser(userDetails);
        // Store in localStorage for future use
        localStorage.setItem('user', JSON.stringify(userDetails));
      } catch (error: any) {
        console.error('❌ Error fetching user details:', error);
        // If unauthorized, handle gracefully
        if (error.message?.includes('Unauthenticated') || error.message?.includes('401')) {
          console.log('User appears to be unauthenticated, clearing stored data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserDetails();
  }, []); // Run only once on mount

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        location: currentUser.location || "",
        bio: currentUser.bio || "",
        company: currentUser.company || "",
      }));
      setProfileImage(currentUser.profileImage || "");
    }
  }, [currentUser]);

  const handleRefreshProfile = async () => {
    try {
      setIsLoading(true);
      
      // Debug token information
      const token = localStorage.getItem('token');
      console.log('Refreshing profile - Token exists:', !!token);
      console.log('Current user before refresh:', currentUser?.email, currentUser?.role);
      
      if (!token) {
        console.log('No token found during refresh, redirecting to login...');
        window.location.href = '/login';
        return;
      }
      
      console.log('Fetching fresh user details from API...');
      const userDetails = await userService.getUserDetails();
      console.log('✅ Fresh user details from API:', userDetails);
      updateCurrentUser(userDetails);
      console.log('✅ Profile refreshed successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('❌ Error refreshing user details:', error);
      
      // Show user-friendly error message without abrupt redirects
      if (error.message?.includes('Unauthenticated') || error.message?.includes('401')) {
        console.log('Session expired during refresh - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // For other errors, show a generic message
        console.log('Profile refresh failed:', error.message);
        // You could show a toast here instead of alert
        alert('Failed to refresh profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();

  const formatLastActive = (date: Date | undefined | null) => {
    if (!date) return 'just now';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        ...formData,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        location: currentUser.location || "",
        bio: currentUser.bio || "",
        company: currentUser.company || "",
      });
    }
    setProfileImage(currentUser?.profileImage || "");
    setImagePreview("");
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!currentUser?.id) {
        throw new Error("User ID is missing.");
      }

      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: currentUser.role,
      };

      console.log('[Profile] Saving user profile to backend:', updateData);
      const updatedUser = await userService.updateUser(currentUser.id, updateData);
      console.log('[Profile] User profile persisted successfully:', updatedUser);

      updateCurrentUser({
        ...currentUser,
        ...updatedUser,
        profileImage: imagePreview || profileImage,
        lastActive: new Date(),
      });
      
      setSaveSuccess(true);
      setEditMode(false);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("[Profile] Failed to save profile:", error);
      alert(error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setProfileImage("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: UserIcon },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <div className="text-center p-8 bg-card rounded-2xl shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/15 text-destructive rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/20 via-background to-purple-50/20 dark:from-blue-950/10 dark:via-background dark:to-purple-950/10 transition-colors duration-300">
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Save Success Notification */}
        {saveSuccess && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-success text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>Profile updated successfully!</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Profile Settings</h2>
            <p className="text-muted-foreground mt-1">
              Manage your account information and preferences
            </p>
          </div>
          <button
            onClick={handleRefreshProfile}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Profile'}
          </button>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="relative rounded-2xl p-6 text-white overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
              {isLoading && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="flex items-center gap-2 text-white">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </div>
              )}
              <div className="relative z-10">
                <div className="flex flex-col items-center text-center mb-6">
                  {/* Profile Image */}
                  <div className="relative group mb-4">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden bg-card/20 backdrop-blur-sm border-4 border-white/30">
                      {imagePreview || profileImage ? (
                        <img
                          src={imagePreview || profileImage}
                          alt={`${currentUser.firstName} ${currentUser.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white">
                          {getInitials(currentUser.firstName, currentUser.lastName)}
                        </span>
                      )}
                    </div>
                    
                    {editMode && (
                      <>
                        <button 
                          className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        {(imagePreview || profileImage) && (
                          <button
                            onClick={removeProfileImage}
                            className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors duration-300"
                            aria-label="Remove profile image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <h1 className="text-2xl font-bold mb-1">
                    {formData.firstName} {formData.lastName}
                  </h1>
                  <p className="text-white/80 mb-3">{currentUser.email}</p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-card/20">
                      {currentUser.role}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Active {formatLastActive(currentUser.lastActive)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {editMode ? (
                  <div className="flex gap-3 flex-wrap justify-center">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/20 hover:bg-card/30 transition-colors duration-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-card text-blue-600 hover:bg-card/90 rounded-lg transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-card/20 hover:bg-card/30 transition-colors duration-300"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Overview
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="text-foreground font-medium">
                    {new Date(currentUser.createdAt || new Date()).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last login</span>
                  <span className="text-foreground font-medium">
                    {formatLastActive(currentUser.lastActive)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span className="px-2 py-1 bg-success/15 text-success text-xs rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 mb-2 overflow-x-auto pb-2 bg-card text-card-foreground border border-border rounded-2xl p-1 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 border border-border"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-1" />}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
              {/* PERSONAL INFO */}
              {activeTab === "personal" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Full Name"
                      value={`${formData.firstName} ${formData.lastName}`.trim()}
                      onChange={(v) => {
                        const nameParts = v.trim().split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        handleChange("firstName", firstName);
                        handleChange("lastName", lastName);
                      }}
                      disabled={!editMode}
                      icon={<UserIcon className="w-4 h-4" />}
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(v) => handleChange("email", v)}
                      disabled={!editMode}
                      icon={<Mail className="w-4 h-4" />}
                    />
                    <InputField
                      label="Phone"
                      value={formData.phone}
                      onChange={(v) => handleChange("phone", v)}
                      disabled={!editMode}
                      icon={<Phone className="w-4 h-4" />}
                      placeholder="Not provided"
                    />
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Role
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                          <Shield className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          disabled={true}
                          value={currentUser?.role || 'Developer'}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground cursor-not-allowed"
                          placeholder="Role assigned by admin"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Status
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          disabled={true}
                          value={currentUser?.isEmailVerified ? 'Active' : 'Inactive'}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Member Since
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                          <Clock className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          disabled={true}
                          value={currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Unknown'}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Last Updated
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        disabled={true}
                        value={currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Unknown'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="bg-accent/40 border border-border p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Change Password
                    </h3>
                    <div className="relative mt-4">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          disabled={!editMode}
                          value={formData.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                          className="w-full px-4 py-3 pr-10 rounded-xl border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 top-0 flex items-center pr-3 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Use at least 8 characters with a mix of letters, numbers & symbols
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Status
                    </h3>
                    <div className="space-y-3">
                      <VerifyStatus 
                        label="Email Verified" 
                        status={currentUser.isEmailVerified} 
                        verifiedDate={currentUser.emailVerifiedDate}
                      />
                      <VerifyStatus 
                        label="Phone Verified" 
                        status={currentUser.isPhoneVerified} 
                        verifiedDate={currentUser.phoneVerifiedDate}
                      />
                      <VerifyStatus 
                        label="Two-Factor Authentication" 
                        status={false} 
                        actionLabel="Enable"
                        onAction={() => console.log("Enable 2FA")}
                      />
                    </div>
                  </div>
                  
                  {editMode && (
                    <div className="pt-4 border-t border-border">
                      <button className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors duration-300 p-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PREFERENCES */}
              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        Language
                      </label>
                      <select
                        disabled={!editMode}
                        value={formData.language}
                        onChange={(e) => handleChange("language", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Japanese">Japanese</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timezone
                      </label>
                      <select
                        disabled={!editMode}
                        value={formData.timezone}
                        onChange={(e) => handleChange("timezone", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time (EST)</option>
                        <option value="PST">Pacific Time (PST)</option>
                        <option value="CET">Central European Time (CET)</option>
                        <option value="JST">Japan Standard Time (JST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </h3>
                  
                  <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border">
                    <ToggleSwitch
                      label="Email Notifications"
                      description="Receive updates, news, and marketing emails"
                      checked={formData.notifications.email}
                      onChange={(v) =>
                        handleChange("notifications", { ...formData.notifications, email: v })
                      }
                      disabled={!editMode}
                    />
                    
                    <ToggleSwitch
                      label="SMS Notifications"
                      description="Get important updates via text message"
                      checked={formData.notifications.sms}
                      onChange={(v) =>
                        handleChange("notifications", { ...formData.notifications, sms: v })
                      }
                      disabled={!editMode}
                    />
                    
                    <ToggleSwitch
                      label="Push Notifications"
                      description="Receive browser notifications"
                      checked={formData.notifications.push}
                      onChange={(v) =>
                        handleChange("notifications", { ...formData.notifications, push: v })
                      }
                      disabled={!editMode}
                    />
                  </div>
                  
                  {editMode && (
                    <div className="pt-4 border-t border-border">
                      <button className="text-sm text-primary hover:underline transition-colors duration-300 flex items-center gap-1">
                        Configure notification preferences in detail
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Reusable Components ---------- */
const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  disabled,
  icon,
  className = "",
  placeholder = "",
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  icon?: React.ReactNode;
  className?: string;
  placeholder?: string;
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-muted-foreground mb-2">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground mt-1">
          {icon}
        </div>
      )}
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full py-3 rounded-xl border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
          icon ? "pl-10 pr-4" : "px-4"
        }`}
      />
    </div>
  </div>
);

const VerifyStatus = ({ 
  label, 
  status = false, 
  verifiedDate,
  actionLabel,
  onAction 
}: { 
  label: string; 
  status?: boolean;
  verifiedDate?: Date | null;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-card text-card-foreground shadow-sm border border-border border-border">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${status ? "bg-green-100" : "bg-destructive/15 text-destructive"}`}>
        {status ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
      </div>
      <div>
        <span className="block text-sm font-medium text-muted-foreground">{label}</span>
        {status && verifiedDate && (
          <span className="text-xs text-muted-foreground">
            Verified on {new Date(verifiedDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {!status && actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="text-sm text-primary hover:underline font-medium px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

const ToggleSwitch = ({
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-card">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground mt-1">{description}</span>
      )}
    </div>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? 'bg-purple-600' : 'bg-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export default Profile;