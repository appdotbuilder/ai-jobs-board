
import { db } from '../db';
import { jobPostsTable, usersTable } from '../db/schema';
import { type CreateJobPostInput, type JobPost } from '../schema';
import { eq } from 'drizzle-orm';

export const createJobPost = async (input: CreateJobPostInput): Promise<JobPost> => {
  try {
    // Validate that employer exists
    const employer = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.employer_id))
      .execute();

    if (employer.length === 0) {
      throw new Error('Employer not found');
    }

    // Insert job post record
    const result = await db.insert(jobPostsTable)
      .values({
        title: input.title,
        company_name: input.company_name,
        description: input.description,
        location: input.location,
        job_type: input.job_type,
        tags: input.tags,
        employer_id: input.employer_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Job post creation failed:', error);
    throw error;
  }
};
