import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StudentSession {
  id: string;
  studentId: string;
  startedAt: string;
  lastActivity: string;
  violations: string[];
  isActive: boolean;
}

interface ViolationEvent {
  type: string;
  studentId: string;
  violation: string;
  timestamp: string;
}

export default function ExamMonitor() {
  const { id } = useParams();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<StudentSession[]>([]);

  const { socket, isConnected } = useWebSocket(`/ws?examId=${id}`);

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

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'studentViolation') {
          setViolations(prev => [{
            type: 'violation',
            studentId: data.studentId,
            violation: data.violation,
            timestamp: data.timestamp
          }, ...prev].slice(0, 50)); // Keep last 50 violations
          
          toast({
            title: "Security Violation Detected",
            description: `Student violated security: ${data.violation}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, toast]);

  const { data: exam } = useQuery<any>({
    queryKey: [`/api/exams/${id}`],
    enabled: !!user && user.role === 'teacher' && !!id
  });

  const { data: sessions = [] } = useQuery<StudentSession[]>({
    queryKey: [`/api/exams/${id}/sessions`],
    enabled: !!user && user.role === 'teacher' && !!id,
    refetchInterval: 5000 // Refetch every 5 seconds
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

  const activeStudentCount = sessions.filter(s => s.isActive).length;
  const totalViolations = violations.length;
  const recentViolations = violations.slice(0, 10);

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
              <h2 className="text-lg text-muted-foreground">Live Monitor</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
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
        {exam && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <p className="text-muted-foreground">Real-time exam monitoring and security alerts</p>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                      <p className="text-2xl font-bold text-foreground">
                        {activeStudentCount}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-green-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Violations</p>
                      <p className="text-2xl font-bold text-foreground">
                        {totalViolations}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-exclamation-triangle text-red-500"></i>
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
                    <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clock text-blue-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Security</p>
                      <p className="text-sm font-medium text-foreground">
                        <Badge variant={exam.requireFullscreen ? "default" : "secondary"}>
                          {exam.requireFullscreen ? "Strict" : "Normal"}
                        </Badge>
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-shield-alt text-yellow-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-user-clock mr-2"></i>
                    Active Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <i className="fas fa-user-slash text-4xl mb-4"></i>
                      <p>No active students</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <div>
                              <div className="font-medium">Student #{session.studentId.slice(-8)}</div>
                              <div className="text-sm text-muted-foreground">
                                Started: {new Date(session.startedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={session.violations.length > 0 ? "destructive" : "secondary"}>
                              {session.violations.length} violations
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              Last active: {new Date(session.lastActivity).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Violations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-exclamation-circle mr-2 text-red-500"></i>
                    Recent Violations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentViolations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <i className="fas fa-check-circle text-4xl mb-4 text-green-500"></i>
                      <p>No security violations detected</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {recentViolations.map((violation, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                          <div className="flex-1">
                            <div className="font-medium text-red-600">{violation.violation}</div>
                            <div className="text-sm text-muted-foreground">
                              Student #{violation.studentId.slice(-8)} • {new Date(violation.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Exam Security Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${exam.requireFullscreen ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">Fullscreen Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${!exam.allowGoogle ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Google Access {exam.allowGoogle ? 'Allowed' : 'Blocked'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Live Monitoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Tab Switch Detection</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}