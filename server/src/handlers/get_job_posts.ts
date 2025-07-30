
import { db } from '../db';
import { jobPostsTable } from '../db/schema';
import { type JobPost } from '../schema';
import { desc } from 'drizzle-orm';

export async function getJobPosts(): Promise<JobPost[]> {
  try {
    const results = await db.select()
      .from(jobPostsTable)
      .orderBy(desc(jobPostsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch job posts:', error);
    throw error;
  }
}
