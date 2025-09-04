import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentEditor } from "@/components/document-editor";

export default function ExamCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [title, setTitle] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [duration, setDuration] = useState(90);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allowGoogle, setAllowGoogle] = useState(false);
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [content, setContent] = useState("");

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["/api/classes/teacher"],
    enabled: !!user && user.role === 'teacher'
  });

  const createExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      const response = await apiRequest("POST", "/api/exams", examData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam created successfully!",
      });
      navigate('/teacher-dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create exam. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    if (!title.trim() || !selectedClassId || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createExamMutation.mutate({
      title: title.trim(),
      classId: selectedClassId,
      content,
      durationMinutes: duration,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      allowGoogle,
      requireFullscreen,
      isPublished: false
    });
  };

  const handlePublishExam = () => {
    if (!title.trim() || !selectedClassId || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createExamMutation.mutate({
      title: title.trim(),
      classId: selectedClassId,
      content,
      durationMinutes: duration,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      allowGoogle,
      requireFullscreen,
      isPublished: true
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card shadow-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/teacher-dashboard')}
              data-testid="button-back"
            >
              <i className="fas fa-arrow-left"></i>
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Create New Exam</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={handleSaveDraft}
              disabled={createExamMutation.isPending}
              data-testid="button-save-draft"
            >
              Save Draft
            </Button>
            <Button 
              onClick={handlePublishExam}
              disabled={createExamMutation.isPending}
              data-testid="button-publish-exam"
            >
              Publish Exam
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Exam Settings */}
        <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
          <h3 className="font-semibold text-foreground mb-4">Exam Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exam-title">Exam Title</Label>
              <Input
                id="exam-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter exam title"
                data-testid="input-exam-title"
              />
            </div>
            
            <div>
              <Label htmlFor="class-select">Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                placeholder="90"
                data-testid="input-duration"
              />
            </div>
            
            <div>
              <Label htmlFor="start-time">Start Date & Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                data-testid="input-start-time"
              />
            </div>
            
            <div>
              <Label htmlFor="end-time">End Date & Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                data-testid="input-end-time"
              />
            </div>
            
            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-foreground mb-3">Permissions</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="allow-google"
                    checked={allowGoogle}
                    onCheckedChange={(checked) => setAllowGoogle(checked as boolean)}
                    data-testid="checkbox-allow-google"
                  />
                  <Label htmlFor="allow-google" className="text-sm">Allow Google Search</Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="require-fullscreen"
                    checked={requireFullscreen}
                    onCheckedChange={(checked) => setRequireFullscreen(checked as boolean)}
                    data-testid="checkbox-require-fullscreen"
                  />
                  <Label htmlFor="require-fullscreen" className="text-sm">Fullscreen Required</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Editor */}
        <div className="flex-1 flex flex-col bg-background">
          <DocumentEditor
            content={content}
            onChange={setContent}
            placeholder="Start typing your exam content here..."
          />
        </div>
      </div>
    </div>
  );
}
