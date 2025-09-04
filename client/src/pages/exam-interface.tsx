import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useExamMonitoring } from "@/hooks/useExamMonitoring";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentEditor } from "@/components/document-editor";
import { ExamTimer } from "@/components/exam-timer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ExamInterface() {
  const { id: examId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const { data: exam } = useQuery<any>({
    queryKey: ["/api/exams", examId],
    enabled: !!examId
  });

  const { violations, isMonitoring } = useExamMonitoring(examId!, user?.id!);

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/exam-sessions", { examId });
      return response.json();
    },
    onSuccess: () => {
      setExamStarted(true);
      enterFullscreen();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start exam session",
        variant: "destructive",
      });
    }
  });

  const submitExamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/submissions", {
        examId,
        content: studentAnswer
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam submitted successfully!",
      });
      exitFullscreen();
      navigate('/student-dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit exam",
        variant: "destructive",
      });
    }
  });

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Failed to enter fullscreen:', err);
        toast({
          title: "Warning",
          description: "Could not enter fullscreen mode. This may affect exam monitoring.",
          variant: "destructive"
        });
      });
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleStartExam = () => {
    startSessionMutation.mutate();
  };

  const handleSubmitExam = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    submitExamMutation.mutate();
    setShowSubmitDialog(false);
  };

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Exam not found</h1>
          <Button onClick={() => navigate('/student-dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="mb-8">
            <div className="h-16 w-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-check text-2xl text-primary-foreground"></i>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{exam.title}</h1>
            <p className="text-muted-foreground">Duration: {exam.durationMinutes} minutes</p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border mb-8">
            <h2 className="font-semibold text-foreground mb-4">Exam Instructions</h2>
            <div className="space-y-2 text-sm text-muted-foreground text-left">
              <p>• This exam requires {exam.requireFullscreen ? "fullscreen mode" : "focus"}.</p>
              <p>• Google search is {exam.allowGoogle ? "allowed" : "not permitted"}.</p>
              <p>• Tab switching and window changes are monitored.</p>
              <p>• Your progress is automatically saved.</p>
              <p>• Make sure you have a stable internet connection.</p>
            </div>
          </div>

          <Button 
            onClick={handleStartExam}
            disabled={startSessionMutation.isPending}
            size="lg"
            data-testid="button-start-exam"
          >
            {startSessionMutation.isPending ? "Starting..." : "Start Exam"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-background" : "min-h-screen bg-background"}>
      {/* Exam Header */}
      <div className="bg-card shadow-sm border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-shield-alt text-primary-foreground"></i>
          </div>
          <div>
            <h1 className="font-semibold text-foreground">{exam.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Student: <span data-testid="text-student-name">{user?.firstName || user?.email}</span></span>
              <span>Duration: {exam.durationMinutes} minutes</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ExamTimer durationMinutes={exam.durationMinutes} onTimeUp={() => submitExamMutation.mutate()} />
          <div className="flex items-center space-x-2 text-sm text-accent">
            <i className={`fas fa-circle text-xs ${isMonitoring ? 'animate-pulse' : ''}`}></i>
            <span data-testid="text-monitoring-status">
              {isMonitoring ? 'Monitored' : 'Monitoring...'}
            </span>
          </div>
          <Button 
            onClick={handleSubmitExam}
            variant="default"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            data-testid="button-submit-exam"
          >
            Submit Exam
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Optional Google Search Panel */}
        {exam.allowGoogle && (
          <div className="w-80 bg-card border-r border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Research Tools</h3>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Search Google..."
                className="w-full"
                data-testid="input-google-search"
              />
              <div className="text-sm text-muted-foreground">
                <p>Search results will appear here. All searches are logged for academic integrity purposes.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Document Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto bg-card shadow-sm rounded-lg p-8 border border-border">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Exam Questions</h2>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: exam.content }}
                data-testid="content-exam-questions"
              />
            </div>
            
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Answers</h3>
              <DocumentEditor
                content={studentAnswer}
                onChange={setStudentAnswer}
                placeholder="Type your answers here..."
                showToolbar={false}
                data-testid="editor-student-answers"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to submit your exam? This action cannot be undone.
            </p>
            {violations.length > 0 && (
              <div className="bg-destructive/10 p-3 rounded-md">
                <p className="text-sm text-destructive font-medium">
                  Warning: {violations.length} monitoring violations detected
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmSubmit}
                disabled={submitExamMutation.isPending}
                data-testid="button-confirm-submit"
              >
                {submitExamMutation.isPending ? "Submitting..." : "Submit Exam"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
