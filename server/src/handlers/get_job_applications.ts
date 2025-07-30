
import { db } from '../db';
import { jobApplicationsTable, jobPostsTable } from '../db/schema';
import { type GetJobApplicationsInput, type JobApplication } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getJobApplications = async (input: GetJobApplicationsInput): Promise<JobApplication[]> => {
  try {
    // Query applications with a join to validate employer ownership
    const results = await db.select({
      id: jobApplicationsTable.id,
      job_post_id: jobApplicationsTable.job_post_id,
      applicant_name: jobApplicationsTable.applicant_name,
      applicant_email: jobApplicationsTable.applicant_email,
      short_answer: jobApplicationsTable.short_answer,
      created_at: jobApplicationsTable.created_at,
    })
      .from(jobApplicationsTable)
      .innerJoin(jobPostsTable, eq(jobApplicationsTable.job_post_id, jobPostsTable.id))
      .where(and(
        eq(jobApplicationsTable.job_post_id, input.job_post_id),
        eq(jobPostsTable.employer_id, input.employer_id)
      ))
      .execute();

    return results;
  } catch (error) {
    console.error('Get job applications failed:', error);
    throw error;
  }
};
