import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    if (!isLoading && user?.role === 'teacher') {
      navigate('/teacher-dashboard');
    }
  }, [isAuthenticated, isLoading, user, toast, navigate]);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["/api/classes/student"],
    enabled: !!user && user.role === 'student'
  });

  const { data: availableExams = [] } = useQuery<any[]>({
    queryKey: ["/api/exams/student"],
    enabled: !!user && user.role === 'student'
  });

  const joinClassMutation = useMutation({
    mutationFn: async (joinCode: string) => {
      const response = await apiRequest("POST", "/api/classes/join", { joinCode });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Joined class successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes/student"] });
      setJoinCode("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join class. Please check the code and try again.",
        variant: "destructive",
      });
    },
  });

  const handleJoinClass = () => {
    if (!joinCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a class code",
        variant: "destructive",
      });
      return;
    }
    
    joinClassMutation.mutate(joinCode.trim().toUpperCase());
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout", {});
      window.location.href = "/";
    } catch (error) {
      // Handle error or just redirect anyway
      window.location.href = "/";
    }
  };

  const startExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== 'student') return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-shield-alt text-primary-foreground"></i>
              </div>
              <h1 className="text-xl font-semibold text-foreground">ExamGuard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, <span data-testid="text-student-name">{user.firstName || user.email}</span>
              </span>
              <button 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">My Classes</h2>
          
          {/* Join Class Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Join a New Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <Input
                  type="text"
                  placeholder="Enter class code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1"
                  maxLength={6}
                  data-testid="input-join-code"
                />
                <Button 
                  onClick={handleJoinClass}
                  disabled={joinClassMutation.isPending}
                  data-testid="button-join-class"
                >
                  Join Class
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Classes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.length === 0 ? (
              <div className="col-span-full text-center p-8 text-muted-foreground">
                No classes joined yet. Use a class code provided by your teacher to join a class.
              </div>
            ) : (
              classes.map((cls: any) => (
                <Card key={cls.id} data-testid={`card-class-${cls.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">{cls.description || "No description"}</p>
                      </div>
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        Active
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Join Code:</span>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{cls.joinCode}</code>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="text-foreground">{new Date(cls.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid={`button-view-class-${cls.id}`}
                      >
                        View Class
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Available Exams */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Available Exams</h2>
          <div className="space-y-4">
            {availableExams.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No exams available at the moment. Check back later for new assignments.
                </CardContent>
              </Card>
            ) : (
              availableExams.map((exam: any) => (
                <Card key={exam.id} data-testid={`card-exam-${exam.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{exam.title}</h3>
                          <Badge variant="destructive" className="animate-pulse">
                            <i className="fas fa-circle text-xs mr-1"></i>
                            Available
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>Duration: {exam.durationMinutes} minutes</div>
                          <div>Google: {exam.allowGoogle ? "Allowed" : "Disabled"}</div>
                          <div>Fullscreen: {exam.requireFullscreen ? "Required" : "Optional"}</div>
                          <div>
                            Deadline: {exam.endTime ? new Date(exam.endTime).toLocaleString() : "No deadline"}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="default"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 ml-4"
                        onClick={() => startExam(exam.id)}
                        data-testid={`button-start-exam-${exam.id}`}
                      >
                        Start Exam
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
