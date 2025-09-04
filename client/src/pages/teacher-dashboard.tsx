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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function TeacherDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");

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
    
    if (!isLoading && user?.role !== 'teacher') {
      navigate('/student-dashboard');
    }
  }, [isAuthenticated, isLoading, user, toast, navigate]);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["/api/classes/teacher"],
    enabled: !!user && user.role === 'teacher'
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/api/exams/teacher"],
    enabled: !!user && user.role === 'teacher'
  });

  const createClassMutation = useMutation({
    mutationFn: async (classData: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/classes", classData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes/teacher"] });
      setIsCreateClassOpen(false);
      setClassName("");
      setClassDescription("");
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
        description: "Failed to create class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClass = () => {
    if (!className.trim()) {
      toast({
        title: "Validation Error",
        description: "Class name is required",
        variant: "destructive",
      });
      return;
    }
    
    createClassMutation.mutate({
      name: className.trim(),
      description: classDescription.trim()
    });
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

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== 'teacher') return null;

  const activeExams = exams.filter((exam: any) => exam.isPublished && new Date() >= new Date(exam.startTime) && new Date() <= new Date(exam.endTime));

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
                Welcome, <span data-testid="text-teacher-name">{user.firstName || user.email}</span>
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

      <div className="flex h-screen pt-16">
        <nav className="w-64 bg-card border-r border-border">
          <div className="p-4 space-y-2">
            <a href="#" className="flex items-center space-x-3 px-4 py-2 bg-primary/10 text-primary rounded-lg">
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </a>
            <button 
              onClick={() => {
                document.querySelector('[data-testid="section-classes"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center space-x-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg w-full text-left"
            >
              <i className="fas fa-users"></i>
              <span>Classes</span>
            </button>
            <button 
              onClick={() => {
                document.querySelector('[data-testid="section-exams"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center space-x-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg w-full text-left"
            >
              <i className="fas fa-file-alt"></i>
              <span>Exams</span>
            </button>
            <button 
              onClick={() => navigate('/results')}
              className="flex items-center space-x-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg w-full text-left"
            >
              <i className="fas fa-chart-bar"></i>
              <span>Results</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 p-6 bg-background overflow-y-auto">
          <div className="max-w-6xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Teacher Dashboard</h2>
              <div className="space-x-3">
                <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" data-testid="button-new-class">
                      <i className="fas fa-plus mr-2"></i>New Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Class</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="class-name">Class Name</Label>
                        <Input
                          id="class-name"
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          placeholder="e.g., Mathematics 101"
                          data-testid="input-class-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="class-description">Description (Optional)</Label>
                        <Textarea
                          id="class-description"
                          value={classDescription}
                          onChange={(e) => setClassDescription(e.target.value)}
                          placeholder="Brief description of the class"
                          data-testid="input-class-description"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateClassOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateClass}
                          disabled={createClassMutation.isPending}
                          data-testid="button-create-class"
                        >
                          Create Class
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button onClick={() => navigate('/exam-creator')} data-testid="button-new-exam">
                  <i className="fas fa-plus mr-2"></i>New Exam
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Classes</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-total-classes">
                        {classes.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-primary"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Exams</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-active-exams">
                        {activeExams.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-file-alt text-accent"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Exams</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-total-exams">
                        {exams.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clipboard-list text-secondary"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Students</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-total-students">
                        {classes.reduce((acc: number, cls: any) => acc + (cls.enrollmentCount || 0), 0)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                      <i className="fas fa-graduation-cap text-muted-foreground"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Classes Table */}
            <Card className="mb-8" data-testid="section-classes">
              <CardHeader>
                <CardTitle>Recent Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Class Name</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Join Code</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-8 text-muted-foreground">
                            No classes created yet. Create your first class to get started.
                          </td>
                        </tr>
                      ) : (
                        classes.map((cls: any) => (
                          <tr key={cls.id} data-testid={`row-class-${cls.id}`}>
                            <td className="p-4">
                              <div className="font-medium text-foreground">{cls.name}</div>
                              <div className="text-sm text-muted-foreground">{cls.description}</div>
                            </td>
                            <td className="p-4">
                              <code className="bg-muted px-2 py-1 rounded text-sm" data-testid={`text-join-code-${cls.id}`}>
                                {cls.joinCode}
                              </code>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(cls.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary" className="bg-accent/10 text-accent">
                                Active
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex space-x-2">
                                <button 
                                  className="text-primary hover:text-primary/80"
                                  data-testid={`button-edit-class-${cls.id}`}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="text-muted-foreground hover:text-foreground"
                                  data-testid={`button-view-class-${cls.id}`}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Active Exams Monitoring */}
            <Card data-testid="section-exams">
              <CardHeader>
                <CardTitle>Live Exam Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeExams.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No active exams at the moment.
                    </div>
                  ) : (
                    activeExams.map((exam: any) => (
                      <div 
                        key={exam.id} 
                        className="border border-border rounded-lg p-4"
                        data-testid={`card-active-exam-${exam.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-foreground">{exam.title}</h4>
                            <p className="text-sm text-muted-foreground">Active exam in progress</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center text-sm text-accent">
                              <i className="fas fa-circle text-xs mr-1 animate-pulse"></i>
                              Live
                            </span>
                            <Button 
                              size="sm" 
                              data-testid={`button-monitor-exam-${exam.id}`}
                              onClick={() => navigate(`/exam/${exam.id}/monitor`)}
                            >
                              Monitor
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Started:</span>
                            <span className="ml-1 text-foreground">
                              {new Date(exam.startTime).toLocaleTimeString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="ml-1 text-foreground">{exam.durationMinutes} min</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Google:</span>
                            <span className="ml-1 text-foreground">
                              {exam.allowGoogle ? "Allowed" : "Disabled"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fullscreen:</span>
                            <span className="ml-1 text-foreground">
                              {exam.requireFullscreen ? "Required" : "Optional"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
