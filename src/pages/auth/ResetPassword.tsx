import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiKey, HiEye, HiEyeOff, HiArrowLeft, HiMail, HiShieldCheck } from "react-icons/hi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/authService";

type ResetStep = 'email' | 'code' | 'reset';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<ResetStep>(searchParams.get('email') ? 'code' : 'email');
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    code: '',
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle email submission for verification code
  const handleSendCode = async () => {
    if (!formData.email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.requestPasswordReset(formData.email);
      setStep('code');
      startCountdown();
    } catch (error: any) {
      setError(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async () => {
    if (!formData.code) {
      setError("Verification code is required");
      return;
    }

    if (formData.code.length !== 6) {
      setError("Please enter a valid 6-character code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Actually verify the code with the backend before proceeding
      // console.log('Verifying code:', formData.code, 'for email:', formData.email);
      const result = await authService.verifyPasswordResetCode(formData.email, formData.code);
      
      if (result?.skipVerification) {
        // console.log('⚠️ Code verification skipped - will validate during password reset');
        // Show a warning that verification will happen during password reset
        setError("Code format validated. Final verification will occur when you submit your new password.");
        // Clear the error after a short delay and proceed
        setTimeout(() => {
          setError("");
          setStep('reset');
        }, 2000);
      } else {
        // console.log('✅ Code verification successful, proceeding to password reset');
        setStep('reset');
      }
    } catch (error: any) {
      console.error('❌ Code verification failed:', error.message);
      setError(error.message || "Invalid verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.resetPassword(
        formData.email,
        formData.code,
        formData.newPassword
      );
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return "Password must include uppercase, lowercase, number, and special character";
    }
    return "";
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBackToLogin = () => navigate("/login");

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <HiShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-foreground dark:text-slate-50">Password Reset Successful</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-slate-400">
              Your password has been updated successfully. Please wait a few moments before attempting to log in, as password changes may take time to propagate in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button onClick={handleBackToLogin} className="w-full max-w-xs">
                Back to Login
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground dark:text-slate-400">
              <p className="mb-2">💡 <strong>Important:</strong></p>
              <ul className="text-left space-y-1 max-w-xs mx-auto">
                <li>• Wait 30-60 seconds before logging in</li>
                <li>• Password updates may take time to sync</li>
                <li>• If login fails, wait 2-3 minutes and try again</li>
                <li>• Clear browser cache if issues persist</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Email input
  if (step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Button 
              variant="ghost" 
              className="w-fit p-0 mb-4"
              onClick={handleBackToLogin}
            >
              <HiArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
            <CardTitle className="text-2xl font-bold text-foreground dark:text-slate-50">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-slate-400">
              Enter your email address and we'll send you a verification code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>
              
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handleSendCode}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Verification code input
  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Button 
              variant="ghost" 
              className="w-fit p-0 mb-4"
              onClick={() => setStep('email')}
              disabled={loading}
            >
              <HiArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle className="text-2xl font-bold text-foreground dark:text-slate-50">Enter Verification Code</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-slate-400">
              We've sent a verification code to {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code from email (case-sensitive)"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  disabled={loading}
                  maxLength={6}
                  style={{ textTransform: 'none' }}
                />
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  Enter the 6-character code exactly as shown in your email (case-sensitive)
                </p>
              </div>
              
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handleVerifyCode}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Continue"}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground dark:text-slate-400">
                {countdown > 0 ? (
                  <span>Resend code in {countdown}s</span>
                ) : (
                  <button 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={handleSendCode}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Reset password
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button 
            variant="ghost" 
            className="w-fit p-0 mb-4"
            onClick={() => setStep('code')}
            disabled={loading}
          >
            <HiArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardTitle className="text-2xl font-bold text-foreground dark:text-slate-50">Create New Password</CardTitle>
          <CardDescription className="text-muted-foreground dark:text-slate-400">
            Your new password must be different from previous used passwords.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiKey className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                </div>
                <Input
                  id="newPassword"
                  type={showPassword.new ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                  disabled={loading}
                >
                  {showPassword.new ? (
                    <HiEyeOff className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                  ) : (
                    <HiEye className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
                Must be at least 8 characters with uppercase, lowercase, number, and special character.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiKey className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showPassword.confirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                  disabled={loading}
                >
                  {showPassword.confirm ? (
                    <HiEyeOff className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                  ) : (
                    <HiEye className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}
            
            <Button 
              className="w-full mt-2" 
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};