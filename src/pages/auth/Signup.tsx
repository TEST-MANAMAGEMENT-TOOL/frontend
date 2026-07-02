import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/user-store";
import { authService } from "@/services/authService";

interface TempUserData {
  fullName: string;
  username: string;
  email: string;
  role: string;
  signupTimestamp: Date;
  verificationCode?: string;
}

interface SignupFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { setTempUserData, clearTempUserData } = useUserStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [signupForm, setSignupForm] = useState<SignupFormData>({ 
    fullName: "", 
    username: "",
    email: "", 
    password: "", 
    confirmPassword: "",
    role: "", 
  });

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validation checks
    if (!signupForm.fullName || !signupForm.username || !signupForm.email || 
        !signupForm.password || !signupForm.confirmPassword || !signupForm.role) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupForm.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Call the authService.register method
      const result = await authService.register({
        firstName: signupForm.fullName.split(' ')[0],
        lastName: signupForm.fullName.split(' ').slice(1).join(' ') || '',
        username: signupForm.username,
        email: signupForm.email,
        password: signupForm.password,
        role: signupForm.role
      });

      if (result.success) {
        // Store minimal user data for verification
        setTempUserData({
          fullName: signupForm.fullName,
          username: signupForm.username,
          email: signupForm.email,
          role: signupForm.role,
          signupTimestamp: new Date()
        });

        // Redirect to verification page with email
        navigate('/verify-email', { 
          state: { 
            email: signupForm.email,
            message: result.message || 'Please check your email for the verification code.'
          } 
        });
      } else {
        throw new Error(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    clearTempUserData();
    navigate("/login", { replace: true });
  };

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible(!confirmPasswordVisible);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-0">
      <div className="w-full h-screen flex flex-col md:flex-row">
        {/* Left side - Image - Full height and width on desktop */}
        <div className="hidden md:flex md:w-1/2 h-full">
          <img
            src="https://media.istockphoto.com/id/1471444483/photo/customer-satisfaction-survey-concept-users-rate-service-experiences-on-online-application.jpg?b=1&s=612x612&w=0&k=20&c=2Wtg2ur5qT3ZFazgxIJYmkPD1ds8p_IVMmrABjZ4NOM="
            alt="Smart farming illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side - Form - Full height and width on desktop */}
        <div className="w-full md:w-1/2 bg-card dark:bg-slate-900 flex items-center justify-center p-6 md:p-8">
          <form onSubmit={handleSignup} className="w-full max-w-md">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-bold text-center md:text-left text-foreground dark:text-slate-50">
                Create Account
              </CardTitle>
              <CardDescription className="text-center md:text-left text-muted-foreground dark:text-slate-400">
                Fill in the details to sign up
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                  placeholder="Choose a username"
                  className="w-full"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Create a password"
                    className="w-full pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-slate-200"
                  >
                    {passwordVisible ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="w-full pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-slate-200"
                  >
                    {confirmPasswordVisible ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <select 
                  id="role"
                  value={signupForm.role || ""}
                  onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                  className="w-full border border-input dark:border-slate-700 rounded-md px-3 py-2 bg-card dark:bg-slate-800 text-foreground dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
                  required
                >
                  <option value="" disabled>Select your role</option>
                  <option value="Tester">Tester</option>
                  <option value="Developer">Developer</option>
                </select>
              </div>

              {/* Signup button */}
              <Button
                type="submit"
                className="w-full mt-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              {/* Login link */}
              <p className="text-center text-sm text-muted-foreground dark:text-slate-400 mt-6">
                Already have an account?{" "}
                <button 
                  onClick={navigateToLogin} 
                  className="text-green-600 dark:text-green-500 hover:underline font-medium"
                  type="button"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </form>
        </div>
      </div>
    </div>
  );
};