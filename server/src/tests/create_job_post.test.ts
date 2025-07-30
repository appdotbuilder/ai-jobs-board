
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobPostsTable, usersTable } from '../db/schema';
import { type CreateJobPostInput } from '../schema';
import { createJobPost } from '../handlers/create_job_post';
import { eq } from 'drizzle-orm';

describe('createJobPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'employer@test.com',
        password_hash: 'hashedpass123',
        company_name: 'Test Company'
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreateJobPostInput = {
    title: 'Senior Developer',
    company_name: 'Test Company',
    description: 'We are looking for a senior developer to join our team',
    location: 'San Francisco, CA',
    job_type: 'full-time',
    tags: ['javascript', 'react', 'node.js'],
    employer_id: 0 // Will be set in tests
  };

  it('should create a job post successfully', async () => {
    const user = await createTestUser();
    const input = { ...testInput, employer_id: user.id };

    const result = await createJobPost(input);

    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Senior Developer');
    expect(result.company_name).toEqual('Test Company');
    expect(result.description).toEqual(testInput.description);
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.job_type).toEqual('full-time');
    expect(result.tags).toEqual(['javascript', 'react', 'node.js']);
    expect(result.employer_id).toEqual(user.id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save job post to database', async () => {
    const user = await createTestUser();
    const input = { ...testInput, employer_id: user.id };

    const result = await createJobPost(input);

    const jobPosts = await db.select()
      .from(jobPostsTable)
      .where(eq(jobPostsTable.id, result.id))
      .execute();

    expect(jobPosts).toHaveLength(1);
    const savedJobPost = jobPosts[0];
    expect(savedJobPost.title).toEqual('Senior Developer');
    expect(savedJobPost.company_name).toEqual('Test Company');
    expect(savedJobPost.description).toEqual(testInput.description);
    expect(savedJobPost.location).toEqual('San Francisco, CA');
    expect(savedJobPost.job_type).toEqual('full-time');
    expect(savedJobPost.tags).toEqual(['javascript', 'react', 'node.js']);
    expect(savedJobPost.employer_id).toEqual(user.id);
    expect(savedJobPost.created_at).toBeInstanceOf(Date);
    expect(savedJobPost.updated_at).toBeInstanceOf(Date);
  });

  it('should handle empty tags array', async () => {
    const user = await createTestUser();
    const input = { 
      ...testInput, 
      employer_id: user.id,
      tags: []
    };

    const result = await createJobPost(input);

    expect(result.tags).toEqual([]);
    expect(Array.isArray(result.tags)).toBe(true);
  });

  it('should handle different job types', async () => {
    const user = await createTestUser();
    
    const jobTypes = ['full-time', 'part-time', 'contract', 'remote'] as const;
    
    for (const jobType of jobTypes) {
      const input = { 
        ...testInput, 
        employer_id: user.id,
        job_type: jobType,
        title: `${jobType} Position`
      };

      const result = await createJobPost(input);
      expect(result.job_type).toEqual(jobType);
      expect(result.title).toEqual(`${jobType} Position`);
    }
  });

  it('should throw error when employer does not exist', async () => {
    const input = { ...testInput, employer_id: 999999 };

    await expect(createJobPost(input)).rejects.toThrow(/employer not found/i);
  });

  it('should handle large tags array', async () => {
    const user = await createTestUser();
    const largeTags = [
      'javascript', 'typescript', 'react', 'vue', 'angular',
      'node.js', 'express', 'nestjs', 'mongodb', 'postgresql',
      'redis', 'docker', 'kubernetes', 'aws', 'azure'
    ];
    
    const input = { 
      ...testInput, 
      employer_id: user.id,
      tags: largeTags
    };

    const result = await createJobPost(input);

    expect(result.tags).toEqual(largeTags);
    expect(result.tags).toHaveLength(15);
  });

  it('should handle long description', async () => {
    const user = await createTestUser();
    const longDescription = 'A'.repeat(5000); // Very long description
    
    const input = { 
      ...testInput, 
      employer_id: user.id,
      description: longDescription
    };

    const result = await createJobPost(input);

    expect(result.description).toEqual(longDescription);
    expect(result.description.length).toEqual(5000);
  });
});
