
import { z } from 'zod';

// User/Employer schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  company_name: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Job post schema
export const jobPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  company_name: z.string(),
  description: z.string(),
  location: z.string(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'remote']),
  tags: z.array(z.string()),
  employer_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobPost = z.infer<typeof jobPostSchema>;

// Job application schema
export const jobApplicationSchema = z.object({
  id: z.number(),
  job_post_id: z.number(),
  applicant_name: z.string(),
  applicant_email: z.string().email(),
  short_answer: z.string(),
  created_at: z.coerce.date()
});

export type JobApplication = z.infer<typeof jobApplicationSchema>;

// Input schemas for creating/updating
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  company_name: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const createJobPostInputSchema = z.object({
  title: z.string().min(1),
  company_name: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'remote']),
  tags: z.array(z.string()),
  employer_id: z.number()
});

export type CreateJobPostInput = z.infer<typeof createJobPostInputSchema>;

export const updateJobPostInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'remote']).optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateJobPostInput = z.infer<typeof updateJobPostInputSchema>;

export const createJobApplicationInputSchema = z.object({
  job_post_id: z.number(),
  applicant_name: z.string().min(1),
  applicant_email: z.string().email(),
  short_answer: z.string().min(1)
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationInputSchema>;

// Query input schemas
export const getJobPostInputSchema = z.object({
  id: z.number()
});

export type GetJobPostInput = z.infer<typeof getJobPostInputSchema>;

export const deleteJobPostInputSchema = z.object({
  id: z.number(),
  employer_id: z.number()
});

export type DeleteJobPostInput = z.infer<typeof deleteJobPostInputSchema>;

export const getJobApplicationsInputSchema = z.object({
  job_post_id: z.number(),
  employer_id: z.number()
});

export type GetJobApplicationsInput = z.infer<typeof getJobApplicationsInputSchema>;
