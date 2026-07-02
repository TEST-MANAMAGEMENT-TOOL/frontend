import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiArrowLeft } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "@/store/user-store";
import { authService } from "@/services/authService";

export const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    getTempUserData, 
    getTempUserEmail, 
    clearTempUserData, 
    addUser, 
    verifyUserEmail
  } = useUserStore();
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Send verification email
  const sendVerificationEmail = async (email: string) => {
    if (!email) {
      console.error('No email provided for verification');
      setError('No email provided for verification');
      return { success: false };
    }

    setResending(true);
    setError('');
    setSuccessMessage('');
    
    try {
      console.log('Sending verification email to:', email);
      const result = await authService.sendVerificationEmail(email);
      
      // If we get here, the email was sent successfully
      setSuccessMessage('Verification code has been sent to your email.');
      setCountdown(60); // Reset countdown
      return { success: true };
      
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      const errorMessage = error?.response?.data?.message || 
                         error.message || 
                         'Failed to send verification email. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setResending(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      console.log('Resending verification code to:', userEmail);
      await authService.sendVerificationEmail(userEmail);
      setSuccessMessage('A new verification code has been sent to your email.');
      setCountdown(60); // Reset countdown to 60 seconds
    } catch (error: any) {
      console.error('Error resending verification code:', error);
      setError(error.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown effect for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // Auto-start countdown on component mount
  useEffect(() => {
    setCountdown(30); // Start with 30 seconds
  }, []);

  // Initialize component
  useEffect(() => {
    // Get email from temp storage or location state
    const email = getTempUserEmail() || (location.state?.email as string);
    
    if (email) {
      setUserEmail(email);
      // Don't automatically send verification email - the registration endpoint already sends it
      // User can click "Resend Code" if they didn't receive it
      setSuccessMessage(location.state?.message || 'A verification code has been sent to your email.');
    } else {
      // No email found, redirect to signup
      setError("No email found. Please sign up again.");
      const timer = setTimeout(() => {
        navigate("/signup", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [getTempUserEmail, navigate, location.state]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-character code");
      return;
    }

    if (!userEmail) {
      setError("Email not found. Please try signing up again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      console.log("Verifying email code:", { email: userEmail, code: verificationCode });
      
      // Use the authService to verify the email code
      const response = await authService.verifyEmailCode(userEmail, verificationCode);
      
      console.log("Email verification successful:", response);
      
      // If we have temp user data, complete the registration
      const tempUserData = getTempUserData();
      if (tempUserData) {
        // Add user to the store
        addUser({
          firstName: tempUserData.fullName.split(' ')[0],
          lastName: tempUserData.fullName.split(' ').slice(1).join(' ') || '',
          username: tempUserData.username,
          email: tempUserData.email,
          password: tempUserData.password || '', // Provide a default empty string if password is undefined
          role: tempUserData.role,
          isEmailVerified: true,
          emailVerifiedDate: new Date(),
          phoneVerifiedDate: new Date(),
          phone: '',
          isPhoneVerified: false,
          lastActive: new Date()
        });
        
        // Clear temp data
        clearTempUserData();
        
        // Set success message
        setSuccessMessage("Email verified successfully! Redirecting to login...");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // If no temp data, just show success and redirect to login
        setSuccessMessage("Email verified successfully! Please log in.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
      
    } catch (error: any) {
      console.error("Email verification error:", error);
      setError(error.message || "Failed to verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Clear temp data and go to login
    clearTempUserData();
    navigate("/login");
  };

  const handleBackToSignup = () => {
    // Clear temp data and go to signup
    clearTempUserData();
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-0">
      <div className="w-full h-screen flex flex-col md:flex-row">
        {/* Left side - Image - Full height and width on desktop */}
        <div className="hidden md:flex md:w-1/2 h-full">
          <img
            src="https://media.istockphoto.com/id/1471444483/photo/customer-satisfaction-survey-concept-users-rate-service-experiences-on-online-application.jpg?b=1&s=612x612&w=0&k=20&c=2Wtg2ur5qT3ZFazgxIJYmkPD1ds8p_IVMmrABjZ4NOM="
            alt="Email verification illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side - Form - Full height and width on desktop */}
        <div className="w-full md:w-1/2 bg-card dark:bg-slate-900 flex items-center justify-center p-6 md:p-8">
          <div className="w-full max-w-md">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-bold text-center md:text-left text-foreground dark:text-slate-50">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-center md:text-left text-muted-foreground dark:text-slate-400">
                {userEmail ? (
                  <>Enter the 6-character code sent to <span className="font-medium">{userEmail}</span></>
                ) : (
                  "Enter the 6-character code sent to your email address."
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 p-3 rounded-md text-sm">
                  {successMessage}
                </div>
              )}

              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-bold"
                    maxLength={1}
                  />
                ))}
              </div>

              <div className="mt-4">
                <Button 
                  type="button" 
                  onClick={handleVerify}
                  disabled={loading || code.join('').length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
                
                <div className="mt-4 text-center text-sm">
                  <p className="text-muted-foreground dark:text-slate-400">
                    Didn't receive a code?{' '}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={countdown > 0}
                      className={`font-medium ${countdown > 0 ? 'text-muted-foreground dark:text-slate-500' : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </button>
                  </p>
                  
                  {successMessage && (
                    <p className="mt-2 text-green-600 dark:text-green-400">{successMessage}</p>
                  )}
                  
                  {error && (
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBackToSignup}
                  variant="outline"
                  className="w-full border-input dark:border-slate-700 text-foreground dark:text-slate-50 hover:bg-accent dark:hover:bg-slate-800"
                >
                  <HiArrowLeft className="mr-2 h-4 w-4" />
                  Back to Signup
                </Button>
                
                <Button
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="w-full border-input dark:border-slate-700 text-foreground dark:text-slate-50 hover:bg-accent dark:hover:bg-slate-800"
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
};