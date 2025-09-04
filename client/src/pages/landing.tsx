import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerRole, setRegisterRole] = useState("student");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: {
      username: string;
      password: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      role: string;
    }) => {
      const response = await apiRequest("POST", "/api/register", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Registration failed. Username may already exist.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({
      username: loginUsername.trim(),
      password: loginPassword
    });
  };

  const handleRegister = () => {
    if (!registerUsername.trim() || !registerPassword.trim()) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      username: registerUsername.trim(),
      password: registerPassword,
      email: registerEmail.trim() || undefined,
      firstName: registerFirstName.trim() || undefined,
      lastName: registerLastName.trim() || undefined,
      role: registerRole
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <i className="fas fa-shield-alt text-2xl text-primary-foreground"></i>
          </div>
          <h1 className="text-3xl font-bold text-foreground">ExamGuard</h1>
          <p className="text-muted-foreground mt-2">Secure Educational Testing Platform</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex space-x-1 bg-muted rounded-lg p-1">
              <button 
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  isLogin 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsLogin(true)}
                data-testid="button-login-tab"
              >
                Log In
              </button>
              <button 
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  !isLogin 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsLogin(false)}
                data-testid="button-signup-tab"
              >
                Sign Up
              </button>
            </div>
            
            <div className="space-y-4">
              {isLogin ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Enter your username"
                        data-testid="input-login-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        data-testid="input-login-password"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleLogin}
                    disabled={loginMutation.isPending}
                    className="w-full"
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="register-username">Username *</Label>
                      <Input
                        id="register-username"
                        type="text"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        placeholder="Choose a username"
                        data-testid="input-register-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password *</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Choose a password"
                        data-testid="input-register-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-role">I am a:</Label>
                      <Select value={registerRole} onValueChange={setRegisterRole}>
                        <SelectTrigger data-testid="select-register-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email (Optional)</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        data-testid="input-register-email"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="register-firstname">First Name</Label>
                        <Input
                          id="register-firstname"
                          type="text"
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                          placeholder="First name"
                          data-testid="input-register-firstname"
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-lastname">Last Name</Label>
                        <Input
                          id="register-lastname"
                          type="text"
                          value={registerLastName}
                          onChange={(e) => setRegisterLastName(e.target.value)}
                          placeholder="Last name"
                          data-testid="input-register-lastname"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                    className="w-full"
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </>
              )}
              
              <div className="text-xs text-muted-foreground text-center space-y-2">
                <p>✓ Secure fullscreen exam environment</p>
                <p>✓ Real-time monitoring and integrity checks</p>
                <p>✓ Professional document editor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
