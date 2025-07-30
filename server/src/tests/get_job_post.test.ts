
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobPostsTable } from '../db/schema';
import { type GetJobPostInput } from '../schema';
import { getJobPost } from '../handlers/get_job_post';

const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  company_name: 'Test Company'
};

const testJobPost = {
  title: 'Software Engineer',
  company_name: 'Test Company',
  description: 'Looking for a skilled software engineer',
  location: 'San Francisco, CA',
  job_type: 'full-time' as const,
  tags: ['javascript', 'typescript', 'react'],
  employer_id: 1
};

describe('getJobPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a job post by id', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create job post
    const [createdJobPost] = await db.insert(jobPostsTable)
      .values(testJobPost)
      .returning()
      .execute();

    const input: GetJobPostInput = { id: createdJobPost.id };
    const result = await getJobPost(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdJobPost.id);
    expect(result!.title).toEqual('Software Engineer');
    expect(result!.company_name).toEqual('Test Company');
    expect(result!.description).toEqual('Looking for a skilled software engineer');
    expect(result!.location).toEqual('San Francisco, CA');
    expect(result!.job_type).toEqual('full-time');
    expect(result!.tags).toEqual(['javascript', 'typescript', 'react']);
    expect(result!.employer_id).toEqual(1);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent job post', async () => {
    const input: GetJobPostInput = { id: 999 };
    const result = await getJobPost(input);

    expect(result).toBeNull();
  });

  it('should handle job post with empty tags', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create job post with empty tags
    const jobPostWithEmptyTags = {
      ...testJobPost,
      tags: []
    };

    const [createdJobPost] = await db.insert(jobPostsTable)
      .values(jobPostWithEmptyTags)
      .returning()
      .execute();

    const input: GetJobPostInput = { id: createdJobPost.id };
    const result = await getJobPost(input);

    expect(result).not.toBeNull();
    expect(result!.tags).toEqual([]);
  });

  it('should handle different job types', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create job post with remote job type
    const remoteJobPost = {
      ...testJobPost,
      job_type: 'remote' as const
    };

    const [createdJobPost] = await db.insert(jobPostsTable)
      .values(remoteJobPost)
      .returning()
      .execute();

    const input: GetJobPostInput = { id: createdJobPost.id };
    const result = await getJobPost(input);

    expect(result).not.toBeNull();
    expect(result!.job_type).toEqual('remote');
  });
});
