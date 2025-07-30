
import { db } from '../db';
import { jobPostsTable } from '../db/schema';
import { type DeleteJobPostInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteJobPost = async (input: DeleteJobPostInput): Promise<boolean> => {
  try {
    // Delete the job post only if it exists and belongs to the employer
    const result = await db.delete(jobPostsTable)
      .where(and(
        eq(jobPostsTable.id, input.id),
        eq(jobPostsTable.employer_id, input.employer_id)
      ))
      .returning({ id: jobPostsTable.id })
      .execute();

    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Job post deletion failed:', error);
    throw error;
  }
};
