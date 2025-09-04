import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Results() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging back in...",
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

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/api/exams/teacher"],
    enabled: !!user && user.role === 'teacher'
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      window.location.href = "/";
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== 'teacher') return null;

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
              <span className="text-muted-foreground">•</span>
              <h2 className="text-lg text-muted-foreground">Results</h2>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/teacher-dashboard')}
              >
                <i className="fas fa-arrow-left mr-2"></i>Back to Dashboard
              </Button>
              <span className="text-sm text-muted-foreground">
                Welcome, {user.firstName || user.email}
              </span>
              <button 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
          <p className="text-muted-foreground">View and analyze exam submissions and grades</p>
        </div>

        <div className="grid gap-6">
          {exams.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  <i className="fas fa-chart-bar text-4xl"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No Exams Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first exam to start seeing results here.
                </p>
                <Button onClick={() => navigate('/exam-creator')}>
                  <i className="fas fa-plus mr-2"></i>Create New Exam
                </Button>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam: any) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{exam.title}</CardTitle>
                      <p className="text-muted-foreground">
                        Created {new Date(exam.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={exam.isPublished ? "default" : "secondary"}>
                        {exam.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/exam/${exam.id}/results`)}
                      >
                        <i className="fas fa-eye mr-2"></i>View Results
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-1 text-foreground">{exam.durationMinutes} min</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start Time:</span>
                      <span className="ml-1 text-foreground">
                        {exam.startTime ? new Date(exam.startTime).toLocaleString() : 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End Time:</span>
                      <span className="ml-1 text-foreground">
                        {exam.endTime ? new Date(exam.endTime).toLocaleString() : 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-1 text-foreground">
                        {exam.isPublished ? 'Active' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}