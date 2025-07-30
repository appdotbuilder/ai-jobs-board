
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobPostsTable } from '../db/schema';
import { type UpdateJobPostInput } from '../schema';
import { updateJobPost } from '../handlers/update_job_post';
import { eq } from 'drizzle-orm';

describe('updateJobPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testEmployerId: number;
  let testJobPostId: number;

  beforeEach(async () => {
    // Create test employer
    const employerResult = await db.insert(usersTable)
      .values({
        email: 'employer@test.com',
        password_hash: 'hashed_password',
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    testEmployerId = employerResult[0].id;

    // Create test job post
    const jobPostResult = await db.insert(jobPostsTable)
      .values({
        title: 'Original Title',
        company_name: 'Original Company',
        description: 'Original description',
        location: 'Original Location',
        job_type: 'full-time',
        tags: ['javascript', 'node'],
        employer_id: testEmployerId
      })
      .returning()
      .execute();

    testJobPostId = jobPostResult[0].id;
  });

  it('should update all fields when provided', async () => {
    const updateInput: UpdateJobPostInput = {
      id: testJobPostId,
      title: 'Updated Title',
      company_name: 'Updated Company',
      description: 'Updated description',
      location: 'Updated Location',
      job_type: 'remote',
      tags: ['react', 'typescript']
    };

    const result = await updateJobPost(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testJobPostId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.company_name).toEqual('Updated Company');
    expect(result!.description).toEqual('Updated description');
    expect(result!.location).toEqual('Updated Location');
    expect(result!.job_type).toEqual('remote');
    expect(result!.tags).toEqual(['react', 'typescript']);
    expect(result!.employer_id).toEqual(testEmployerId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateJobPostInput = {
      id: testJobPostId,
      title: 'Partially Updated Title',
      tags: ['updated-tag']
    };

    const result = await updateJobPost(updateInput);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Partially Updated Title');
    expect(result!.company_name).toEqual('Original Company'); // Should remain unchanged
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.location).toEqual('Original Location'); // Should remain unchanged
    expect(result!.job_type).toEqual('full-time'); // Should remain unchanged
    expect(result!.tags).toEqual(['updated-tag']);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update the job post in database', async () => {
    const updateInput: UpdateJobPostInput = {
      id: testJobPostId,
      title: 'Database Updated Title',
      description: 'Database updated description'
    };

    await updateJobPost(updateInput);

    // Verify changes are persisted in database
    const jobPosts = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, testJobPostId))
      .execute();

    expect(jobPosts).toHaveLength(1);
    expect(jobPosts[0].title).toEqual('Database Updated Title');
    expect(jobPosts[0].description).toEqual('Database updated description');
    expect(jobPosts[0].company_name).toEqual('Original Company'); // Unchanged
    expect(jobPosts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent job post', async () => {
    const updateInput: UpdateJobPostInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateJobPost(updateInput);

    expect(result).toBeNull();
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalJobPost = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, testJobPostId))
      .execute();

    const originalUpdatedAt = originalJobPost[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobPostInput = {
      id: testJobPostId,
      title: 'Timestamp Test'
    };

    const result = await updateJobPost(updateInput);

    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
