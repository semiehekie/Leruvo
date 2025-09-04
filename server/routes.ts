import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertClassSchema, insertExamSchema, insertExamSubmissionSchema } from "@shared/schema";
import puppeteer from "puppeteer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  const httpServer = createServer(app);
  
  // WebSocket server for real-time monitoring
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const examSessions = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const examId = url.searchParams.get('examId');
    
    if (examId) {
      if (!examSessions.has(examId)) {
        examSessions.set(examId, new Set());
      }
      examSessions.get(examId)!.add(ws);
      
      ws.on('close', () => {
        examSessions.get(examId)?.delete(ws);
      });
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'violation') {
            // Log violation and broadcast to teachers
            const session = await storage.getActiveSession(examId, message.studentId);
            if (session) {
              await storage.addViolation(session.id, `${message.violation} at ${new Date().toISOString()}`);
              
              // Broadcast to all connected clients for this exam
              examSessions.get(examId)?.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'studentViolation',
                    studentId: message.studentId,
                    violation: message.violation,
                    timestamp: new Date().toISOString()
                  }));
                }
              });
            }
          }
          
          if (message.type === 'heartbeat') {
            const session = await storage.getActiveSession(examId, message.studentId);
            if (session) {
              await storage.updateSessionActivity(session.id);
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Class routes
  app.post('/api/classes', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create classes" });
      }

      const classData = insertClassSchema.parse({
        ...req.body,
        teacherId: user.id,
        joinCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      });

      const newClass = await storage.createClass(classData);
      res.json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.get('/api/classes/teacher', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const classes = await storage.getClassesByTeacher(user.id);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.get('/api/classes/student', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const classes = await storage.getClassesForStudent(user.id);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching student classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post('/api/classes/join', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { joinCode } = req.body;

      const classToJoin = await storage.getClassByJoinCode(joinCode);
      if (!classToJoin) {
        return res.status(404).json({ message: "Class not found with that code" });
      }

      const enrollment = await storage.enrollStudent({
        studentId: user.id,
        classId: classToJoin.id
      });

      res.json(enrollment);
    } catch (error) {
      console.error("Error joining class:", error);
      res.status(500).json({ message: "Failed to join class" });
    }
  });

  // Exam routes
  app.post('/api/exams', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create exams" });
      }

      const examData = insertExamSchema.parse({
        ...req.body,
        teacherId: user.id
      });

      const newExam = await storage.createExam(examData);
      res.json(newExam);
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Failed to create exam" });
    }
  });

  app.get('/api/exams/teacher', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const exams = await storage.getExamsByTeacher(user.id);
      res.json(exams);
    } catch (error) {
      console.error("Error fetching teacher exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get('/api/exams/student', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const exams = await storage.getActiveExamsForStudent(user.id);
      res.json(exams);
    } catch (error) {
      console.error("Error fetching student exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get('/api/exams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const examId = req.params.id;
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.json(exam);
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.patch('/api/exams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const examId = req.params.id;
      const user = req.user;
      
      const exam = await storage.getExam(examId);
      if (!exam || exam.teacherId !== user.id) {
        return res.status(403).json({ message: "Unauthorized to update this exam" });
      }

      const updatedExam = await storage.updateExam(examId, req.body);
      res.json(updatedExam);
    } catch (error) {
      console.error("Error updating exam:", error);
      res.status(500).json({ message: "Failed to update exam" });
    }
  });

  // Exam session routes
  app.post('/api/exam-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { examId } = req.body;

      const session = await storage.createSession({
        examId,
        studentId: user.id
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating exam session:", error);
      res.status(500).json({ message: "Failed to create exam session" });
    }
  });

  // Exam submission routes
  app.post('/api/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const submissionData = insertExamSubmissionSchema.parse({
        ...req.body,
        studentId: user.id
      });

      const submission = await storage.createSubmission(submissionData);
      
      // End the exam session
      const session = await storage.getActiveSession(submissionData.examId, user.id);
      if (session) {
        await storage.endSession(session.id);
      }

      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get('/api/submissions/exam/:examId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const examId = req.params.examId;
      
      // Check if user is teacher of this exam
      const exam = await storage.getExam(examId);
      if (!exam || exam.teacherId !== user.id) {
        return res.status(403).json({ message: "Unauthorized to view submissions" });
      }

      const submissions = await storage.getSubmissionsByExam(examId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/submissions/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const submissionId = req.params.id;
      
      // For now, just generate a basic PDF without specific submission data
      const submissionData = { studentId: 'unknown', submittedAt: new Date() };
      
      // Generate PDF using puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(`
        <html>
          <head>
            <style>
              body { font-family: 'Times New Roman', serif; margin: 2cm; line-height: 1.6; }
              h1, h2, h3 { color: #333; }
              .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Exam Submission</h1>
              <p>Student ID: ${submissionData.studentId}</p>
              <p>Submitted: ${submissionData.submittedAt.toLocaleString()}</p>
            </div>
            ${req.body.content || ''}
          </body>
        </html>
      `);
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }
      });
      
      await browser.close();
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=exam-submission.pdf'
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  return httpServer;
}
