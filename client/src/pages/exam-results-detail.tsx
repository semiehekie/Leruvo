import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ExamResultsDetail() {
  const { id } = useParams();
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

  const { data: exam } = useQuery<any>({
    queryKey: [`/api/exams/${id}`],
    enabled: !!user && user.role === 'teacher' && !!id
  });

  const { data: submissions = [] } = useQuery<any[]>({
    queryKey: [`/api/submissions/exam/${id}`],
    enabled: !!user && user.role === 'teacher' && !!id
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

  const submissionCount = submissions.length;
  const averageScore = submissionCount > 0 
    ? Math.round(submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / submissionCount)
    : 0;

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
                onClick={() => navigate('/results')}
              >
                <i className="fas fa-arrow-left mr-2"></i>Back to Results
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
        {exam && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <p className="text-muted-foreground">Exam results and submissions overview</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Submissions</p>
                      <p className="text-2xl font-bold text-foreground">
                        {submissionCount}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-file-alt text-primary"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold text-foreground">
                        {averageScore}%
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-chart-bar text-accent"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-2xl font-bold text-foreground">
                        {exam.durationMinutes}m
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clock text-secondary"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-sm font-medium text-foreground">
                        <Badge variant={exam.isPublished ? "default" : "secondary"}>
                          {exam.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                      <i className="fas fa-info-circle text-muted-foreground"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exam Details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-1 text-foreground">
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
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
                    <span className="text-muted-foreground">Google Access:</span>
                    <span className="ml-1 text-foreground">
                      {exam.allowGoogle ? "Allowed" : "Blocked"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fullscreen:</span>
                    <span className="ml-1 text-foreground">
                      {exam.requireFullscreen ? "Required" : "Optional"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submissions List */}
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-inbox text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
                    <p>Students haven't submitted their exam answers yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Submitted</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Violations</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Score</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {submissions.map((submission: any) => (
                          <tr key={submission.id}>
                            <td className="p-4">
                              <div className="font-medium text-foreground">
                                {submission.studentFirstName && submission.studentLastName 
                                  ? `${submission.studentFirstName} ${submission.studentLastName}`
                                  : submission.studentUsername || `Student #${submission.studentId.slice(-8)}`
                                }
                              </div>
                              {submission.studentEmail && (
                                <div className="text-sm text-muted-foreground">
                                  {submission.studentEmail}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(submission.submittedAt).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <Badge variant={submission.violations && submission.violations.length > 0 ? "destructive" : "secondary"}>
                                {submission.violations?.length || 0} violations
                              </Badge>
                            </td>
                            <td className="p-4 text-foreground font-medium">
                              {submission.score || 'Not graded'}
                            </td>
                            <td className="p-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <i className="fas fa-eye mr-2"></i>View
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                  <DropdownMenuLabel>
                                    Student Answer
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-2">
                                    <div className="text-sm font-medium mb-2">
                                      {submission.studentFirstName && submission.studentLastName 
                                        ? `${submission.studentFirstName} ${submission.studentLastName}`
                                        : submission.studentUsername || 'Student'
                                      }
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-3">
                                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded-md max-h-48 overflow-y-auto">
                                      <div className="text-sm whitespace-pre-wrap">
                                        {submission.content || 'No answer submitted'}
                                      </div>
                                    </div>
                                    {submission.violations && submission.violations.length > 0 && (
                                      <>
                                        <div className="mt-3 text-sm font-medium text-destructive">
                                          Security Violations ({submission.violations.length}):
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          {submission.violations.join(', ')}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}