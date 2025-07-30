
import { serial, text, pgTable, timestamp, integer, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for job types
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'remote']);

// Users/Employers table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  company_name: text('company_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Job posts table
export const jobPostsTable = pgTable('job_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company_name: text('company_name').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  job_type: jobTypeEnum('job_type').notNull(),
  tags: json('tags').$type<string[]>().notNull().default([]),
  employer_id: integer('employer_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Job applications table
export const jobApplicationsTable = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  job_post_id: integer('job_post_id').notNull().references(() => jobPostsTable.id),
  applicant_name: text('applicant_name').notNull(),
  applicant_email: text('applicant_email').notNull(),
  short_answer: text('short_answer').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  jobPosts: many(jobPostsTable),
}));

export const jobPostsRelations = relations(jobPostsTable, ({ one, many }) => ({
  employer: one(usersTable, {
    fields: [jobPostsTable.employer_id],
    references: [usersTable.id],
  }),
  applications: many(jobApplicationsTable),
}));

export const jobApplicationsRelations = relations(jobApplicationsTable, ({ one }) => ({
  jobPost: one(jobPostsTable, {
    fields: [jobApplicationsTable.job_post_id],
    references: [jobPostsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type JobPost = typeof jobPostsTable.$inferSelect;
export type NewJobPost = typeof jobPostsTable.$inferInsert;
export type JobApplication = typeof jobApplicationsTable.$inferSelect;
export type NewJobApplication = typeof jobApplicationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  jobPosts: jobPostsTable, 
  jobApplications: jobApplicationsTable 
};
