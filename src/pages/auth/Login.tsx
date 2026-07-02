import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiEye, HiEyeOff, HiMail, HiKey } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/user-store";

export const Login = () => {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const login = useUserStore((state) => state.login);

  // Login form state
  const [loginForm, setLoginForm] = useState({ 
    email: "", 
    username: "",
    password: "" 
  });

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    if (!loginForm.email || !loginForm.password) {
      setError("Email and Password are required");
      setLoading(false);
      return;
    }

    try {
      // Use the store's login function which handles the API call and state management
      const success = await login(loginForm.email, loginForm.password);
      
      if (success) {
        // Redirect to dashboard on successful login
        navigate("/dashboard", { replace: true });
      } else {
        setError("Invalid email or password");
      }
    } catch (err: any) {
      console.log(`Error: ${err.message}`);
      setError(err.message || "Incorrect/Invalid credentials!!");
    } finally {
      setLoading(false);
    }
  };
    
  const navigateToSignup = () => {
    navigate("/signup");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

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
        <div className="w-full md:w-1/2 bg-card text-card-foreground border-l border-border flex items-center justify-center p-6 md:p-8">
          <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-bold text-center md:text-left text-foreground">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center md:text-left text-muted-foreground">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive dark:bg-destructive/20 border border-destructive/20 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="loginEmail">Email</Label>
                <div className="relative">
                  <HiMail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="loginPassword">Password</Label>
                <div className="relative">
                  <HiKey className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="loginPassword"
                    type={passwordVisible ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {passwordVisible ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <button className="text-sm text-green-600 dark:text-green-500 hover:underline" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>

              {/* Login button */}
              <Button
                onClick={handleLogin}
                className="w-full bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {/* Signup link */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <button 
                  onClick={navigateToSignup} 
                  className="text-green-600 dark:text-green-500 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};