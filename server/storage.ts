import {
  users,
  classes,
  exams,
  examSubmissions,
  classEnrollments,
  examSessions,
  type User,
  type UpsertUser,
  type Class,
  type InsertClass,
  type Exam,
  type InsertExam,
  type ExamSubmission,
  type InsertExamSubmission,
  type ClassEnrollment,
  type InsertClassEnrollment,
  type ExamSession,
  type InsertExamSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Class operations
  createClass(classData: InsertClass): Promise<Class>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  getClassByJoinCode(joinCode: string): Promise<Class | undefined>;
  getClassesForStudent(studentId: string): Promise<Class[]>;
  
  // Enrollment operations
  enrollStudent(enrollment: InsertClassEnrollment): Promise<ClassEnrollment>;
  getClassEnrollments(classId: string): Promise<ClassEnrollment[]>;
  
  // Exam operations
  createExam(examData: InsertExam): Promise<Exam>;
  getExamsByClass(classId: string): Promise<Exam[]>;
  getExamsByTeacher(teacherId: string): Promise<Exam[]>;
  getExam(examId: string): Promise<Exam | undefined>;
  updateExam(examId: string, examData: Partial<InsertExam>): Promise<Exam>;
  getActiveExamsForStudent(studentId: string): Promise<Exam[]>;
  
  // Exam submission operations
  createSubmission(submissionData: InsertExamSubmission): Promise<ExamSubmission>;
  getSubmission(examId: string, studentId: string): Promise<ExamSubmission | undefined>;
  updateSubmission(submissionId: string, content: string): Promise<void>;
  getSubmissionsByExam(examId: string): Promise<ExamSubmission[]>;
  
  // Exam session operations
  createSession(sessionData: InsertExamSession): Promise<ExamSession>;
  getActiveSession(examId: string, studentId: string): Promise<ExamSession | undefined>;
  updateSessionActivity(sessionId: string): Promise<void>;
  addViolation(sessionId: string, violation: string): Promise<void>;
  endSession(sessionId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Class operations
  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.teacherId, teacherId)).orderBy(desc(classes.createdAt));
  }

  async getClassByJoinCode(joinCode: string): Promise<Class | undefined> {
    const [classResult] = await db.select().from(classes).where(eq(classes.joinCode, joinCode));
    return classResult;
  }

  async getClassesForStudent(studentId: string): Promise<Class[]> {
    const enrolledClasses = await db
      .select({ class: classes })
      .from(classEnrollments)
      .innerJoin(classes, eq(classEnrollments.classId, classes.id))
      .where(eq(classEnrollments.studentId, studentId));
    
    return enrolledClasses.map(item => item.class);
  }

  // Enrollment operations
  async enrollStudent(enrollment: InsertClassEnrollment): Promise<ClassEnrollment> {
    const [newEnrollment] = await db.insert(classEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async getClassEnrollments(classId: string): Promise<ClassEnrollment[]> {
    return await db.select().from(classEnrollments).where(eq(classEnrollments.classId, classId));
  }

  // Exam operations
  async createExam(examData: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(examData).returning();
    return newExam;
  }

  async getExamsByClass(classId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.classId, classId)).orderBy(desc(exams.createdAt));
  }

  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.teacherId, teacherId)).orderBy(desc(exams.createdAt));
  }

  async getExam(examId: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
    return exam;
  }

  async updateExam(examId: string, examData: Partial<InsertExam>): Promise<Exam> {
    const [updatedExam] = await db
      .update(exams)
      .set(examData)
      .where(eq(exams.id, examId))
      .returning();
    return updatedExam;
  }

  async getActiveExamsForStudent(studentId: string): Promise<Exam[]> {
    const now = new Date();
    const studentClasses = await db
      .select({ classId: classEnrollments.classId })
      .from(classEnrollments)
      .where(eq(classEnrollments.studentId, studentId));
    
    const classIds = studentClasses.map(c => c.classId);
    
    if (classIds.length === 0) return [];

    return await db
      .select()
      .from(exams)
      .where(
        and(
          eq(exams.isPublished, true),
          // Check if exam is within time bounds
        )
      )
      .orderBy(desc(exams.startTime));
  }

  // Exam submission operations
  async createSubmission(submissionData: InsertExamSubmission): Promise<ExamSubmission> {
    const [submission] = await db.insert(examSubmissions).values(submissionData).returning();
    return submission;
  }

  async getSubmission(examId: string, studentId: string): Promise<ExamSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(examSubmissions)
      .where(
        and(
          eq(examSubmissions.examId, examId),
          eq(examSubmissions.studentId, studentId)
        )
      );
    return submission;
  }

  async updateSubmission(submissionId: string, content: string): Promise<void> {
    await db
      .update(examSubmissions)
      .set({ content })
      .where(eq(examSubmissions.id, submissionId));
  }

  async getSubmissionsByExam(examId: string): Promise<ExamSubmission[]> {
    return await db
      .select()
      .from(examSubmissions)
      .where(eq(examSubmissions.examId, examId))
      .orderBy(desc(examSubmissions.submittedAt));
  }

  // Exam session operations
  async createSession(sessionData: InsertExamSession): Promise<ExamSession> {
    const [session] = await db.insert(examSessions).values(sessionData).returning();
    return session;
  }

  async getActiveSession(examId: string, studentId: string): Promise<ExamSession | undefined> {
    const [session] = await db
      .select()
      .from(examSessions)
      .where(
        and(
          eq(examSessions.examId, examId),
          eq(examSessions.studentId, studentId),
          eq(examSessions.isActive, true)
        )
      );
    return session;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await db
      .update(examSessions)
      .set({ lastActivity: new Date() })
      .where(eq(examSessions.id, sessionId));
  }

  async addViolation(sessionId: string, violation: string): Promise<void> {
    const [session] = await db
      .select()
      .from(examSessions)
      .where(eq(examSessions.id, sessionId));
    
    if (session) {
      const newViolations = [...(session.violations || []), violation];
      await db
        .update(examSessions)
        .set({ violations: newViolations })
        .where(eq(examSessions.id, sessionId));
    }
  }

  async endSession(sessionId: string): Promise<void> {
    await db
      .update(examSessions)
      .set({ isActive: false })
      .where(eq(examSessions.id, sessionId));
  }
}

export const storage = new DatabaseStorage();
