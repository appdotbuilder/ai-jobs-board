
import { db } from '../db';
import { jobApplicationsTable, jobPostsTable } from '../db/schema';
import { type CreateJobApplicationInput, type JobApplication } from '../schema';
import { eq } from 'drizzle-orm';

export async function createJobApplication(input: CreateJobApplicationInput): Promise<JobApplication> {
  try {
    // Validate that the job post exists
    const jobPost = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, input.job_post_id))
      .execute();

    if (jobPost.length === 0) {
      throw new Error(`Job post with id ${input.job_post_id} does not exist`);
    }

    // Insert job application record
    const result = await db.insert(jobApplicationsTable)
      .values({
        job_post_id: input.job_post_id,
        applicant_name: input.applicant_name,
        applicant_email: input.applicant_email,
        short_answer: input.short_answer
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Job application creation failed:', error);
    throw error;
  }
}
