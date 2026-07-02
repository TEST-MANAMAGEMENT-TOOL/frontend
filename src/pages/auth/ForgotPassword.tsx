import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiMail, HiArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.forgotPassword(email);
      // Navigate to reset password page with email as query parameter
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  // Success state - link sent
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-0">
        <div className="w-full h-screen flex flex-col md:flex-row">
          {/* Left side - Image - Full height and width on desktop */}
          <div className="hidden md:flex md:w-1/2 h-full">
            <img
              src="https://media.istockphoto.com/id/1471444483/photo/customer-satisfaction-survey-concept-users-rate-service-experiences-on-online-application.jpg?b=1&s=612x612&w=0&k=20&c=2Wtg2ur5qT3ZFazgxIJYmkPD1ds8p_IVMmrABjZ4NOM="
              alt="Email sent illustration"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Right side - Form - Full height and width on mobile, half on desktop */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-card dark:bg-slate-900">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center text-foreground dark:text-slate-50">Check Your Email</CardTitle>
                <CardDescription className="text-center text-muted-foreground dark:text-slate-400">
                  We've sent a password reset link to {email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-sm text-muted-foreground dark:text-slate-400">
                  <p>If you don't see the email, check your spam folder or try again.</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleBackToLogin}
                >
                  Back to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
          <CardTitle className="text-2xl text-foreground dark:text-slate-50">Forgot Password</CardTitle>
          <CardDescription className="text-muted-foreground dark:text-slate-400">
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSendResetLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};