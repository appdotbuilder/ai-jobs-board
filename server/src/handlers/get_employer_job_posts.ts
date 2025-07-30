
import { db } from '../db';
import { jobPostsTable } from '../db/schema';
import { type JobPost } from '../schema';
import { eq } from 'drizzle-orm';

export const getEmployerJobPosts = async (employerId: number): Promise<JobPost[]> => {
  try {
    const results = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.employer_id, employerId))
      .execute();

    return results.map(jobPost => ({
      ...jobPost,
      tags: jobPost.tags as string[] // Ensure proper type for JSON field
    }));
  } catch (error) {
    console.error('Failed to fetch employer job posts:', error);
    throw error;
  }
};
