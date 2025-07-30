
import { db } from '../db';
import { jobPostsTable } from '../db/schema';
import { type GetJobPostInput, type JobPost } from '../schema';
import { eq } from 'drizzle-orm';

export const getJobPost = async (input: GetJobPostInput): Promise<JobPost | null> => {
  try {
    const result = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const jobPost = result[0];
    return {
      id: jobPost.id,
      title: jobPost.title,
      company_name: jobPost.company_name,
      description: jobPost.description,
      location: jobPost.location,
      job_type: jobPost.job_type,
      tags: jobPost.tags || [],
      employer_id: jobPost.employer_id,
      created_at: jobPost.created_at,
      updated_at: jobPost.updated_at
    };
  } catch (error) {
    console.error('Job post retrieval failed:', error);
    throw error;
  }
};
