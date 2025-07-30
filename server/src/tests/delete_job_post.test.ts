
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobPostsTable } from '../db/schema';
import { type DeleteJobPostInput, type CreateUserInput, type CreateJobPostInput } from '../schema';
import { deleteJobPost } from '../handlers/delete_job_post';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  company_name: 'Test Company'
};

const anotherUser: CreateUserInput = {
  email: 'another@example.com',
  password: 'password123',
  company_name: 'Another Company'
};

const testJobPost: CreateJobPostInput = {
  title: 'Software Engineer',
  company_name: 'Test Company',
  description: 'A great job opportunity',
  location: 'San Francisco, CA',
  job_type: 'full-time',
  tags: ['javascript', 'react'],
  employer_id: 1 // Will be set after creating user
};

describe('deleteJobPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a job post successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashedpassword',
        company_name: testUser.company_name
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test job post
    const jobPostResult = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        employer_id: userId
      })
      .returning()
      .execute();
    
    const jobPostId = jobPostResult[0].id;

    // Delete the job post
    const deleteInput: DeleteJobPostInput = {
      id: jobPostId,
      employer_id: userId
    };

    const result = await deleteJobPost(deleteInput);

    expect(result).toBe(true);

    // Verify job post was deleted
    const jobPosts = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, jobPostId))
      .execute();

    expect(jobPosts).toHaveLength(0);
  });

  it('should return false when job post does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashedpassword',
        company_name: testUser.company_name
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Try to delete non-existent job post
    const deleteInput: DeleteJobPostInput = {
      id: 999, // Non-existent ID
      employer_id: userId
    };

    const result = await deleteJobPost(deleteInput);

    expect(result).toBe(false);
  });

  it('should return false when job post belongs to different employer', async () => {
    // Create first user
    const userResult1 = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashedpassword',
        company_name: testUser.company_name
      })
      .returning()
      .execute();
    
    const userId1 = userResult1[0].id;

    // Create second user
    const userResult2 = await db.insert(usersTable)
      .values({
        email: anotherUser.email,
        password_hash: 'hashedpassword',
        company_name: anotherUser.company_name
      })
      .returning()
      .execute();
    
    const userId2 = userResult2[0].id;

    // Create job post for first user
    const jobPostResult = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        employer_id: userId1
      })
      .returning()
      .execute();
    
    const jobPostId = jobPostResult[0].id;

    // Try to delete with second user's ID
    const deleteInput: DeleteJobPostInput = {
      id: jobPostId,
      employer_id: userId2
    };

    const result = await deleteJobPost(deleteInput);

    expect(result).toBe(false);

    // Verify job post still exists
    const jobPosts = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, jobPostId))
      .execute();

    expect(jobPosts).toHaveLength(1);
  });

  it('should only delete the specified job post', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashedpassword',
        company_name: testUser.company_name
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create multiple job posts
    const jobPost1Result = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        title: 'Job Post 1',
        employer_id: userId
      })
      .returning()
      .execute();

    const jobPost2Result = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        title: 'Job Post 2',
        employer_id: userId
      })
      .returning()
      .execute();
    
    const jobPostId1 = jobPost1Result[0].id;
    const jobPostId2 = jobPost2Result[0].id;

    // Delete only the first job post
    const deleteInput: DeleteJobPostInput = {
      id: jobPostId1,
      employer_id: userId
    };

    const result = await deleteJobPost(deleteInput);

    expect(result).toBe(true);

    // Verify first job post was deleted
    const deletedJobPosts = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, jobPostId1))
      .execute();

    expect(deletedJobPosts).toHaveLength(0);

    // Verify second job post still exists
    const remainingJobPosts = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, jobPostId2))
      .execute();

    expect(remainingJobPosts).toHaveLength(1);
    expect(remainingJobPosts[0].title).toBe('Job Post 2');
  });
});
