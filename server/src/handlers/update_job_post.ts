
import { db } from '../db';
import { jobPostsTable } from '../db/schema';
import { type UpdateJobPostInput, type JobPost } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateJobPost = async (input: UpdateJobPostInput): Promise<JobPost | null> => {
  try {
    // First, check if the job post exists and belongs to the employer
    const existingJobPost = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, input.id))
      .execute();

    if (existingJobPost.length === 0) {
      return null; // Job post not found
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof jobPostsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.company_name !== undefined) {
      updateData.company_name = input.company_name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.location !== undefined) {
      updateData.location = input.location;
    }

    if (input.job_type !== undefined) {
      updateData.job_type = input.job_type;
    }

    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }

    // Update the job post
    const result = await db.update(jobPostsTable)
      .set(updateData)
      .where(eq(jobPostsTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Job post update failed:', error);
    throw error;
  }
};
