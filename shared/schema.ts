import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for username/password auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("student"), // teacher or student
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  joinCode: varchar("join_code").notNull().unique(),
  teacherId: varchar("teacher_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classEnrollments = pgTable("class_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  classId: varchar("class_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(90),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  allowGoogle: boolean("allow_google").notNull().default(false),
  requireFullscreen: boolean("require_fullscreen").notNull().default(true),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const examSubmissions = pgTable("exam_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull(),
  studentId: varchar("student_id").notNull(),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  violations: text("violations").array().default([]),
  tabSwitchCount: integer("tab_switch_count").default(0),
});

export const examSessions = pgTable("exam_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull(),
  studentId: varchar("student_id").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  violations: text("violations").array().default([]),
  isActive: boolean("is_active").notNull().default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teachingClasses: many(classes),
  enrollments: many(classEnrollments),
  createdExams: many(exams),
  examSubmissions: many(examSubmissions),
  examSessions: many(examSessions),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  enrollments: many(classEnrollments),
  exams: many(exams),
}));

export const classEnrollmentsRelations = relations(classEnrollments, ({ one }) => ({
  student: one(users, {
    fields: [classEnrollments.studentId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [classEnrollments.classId],
    references: [classes.id],
  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(classes, {
    fields: [exams.classId],
    references: [classes.id],
  }),
  teacher: one(users, {
    fields: [exams.teacherId],
    references: [users.id],
  }),
  submissions: many(examSubmissions),
  sessions: many(examSessions),
}));

export const examSubmissionsRelations = relations(examSubmissions, ({ one }) => ({
  exam: one(exams, {
    fields: [examSubmissions.examId],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examSubmissions.studentId],
    references: [users.id],
  }),
}));

export const examSessionsRelations = relations(examSessions, ({ one }) => ({
  exam: one(exams, {
    fields: [examSessions.examId],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examSessions.studentId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const registerUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

export const insertExamSubmissionSchema = createInsertSchema(examSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments).omit({
  id: true,
  joinedAt: true,
});

export const insertExamSessionSchema = createInsertSchema(examSessions).omit({
  id: true,
  startedAt: true,
  lastActivity: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type ExamSubmission = typeof examSubmissions.$inferSelect;
export type InsertExamSubmission = z.infer<typeof insertExamSubmissionSchema>;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;
export type ExamSession = typeof examSessions.$inferSelect;
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
