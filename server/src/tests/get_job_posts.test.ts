
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobPostsTable } from '../db/schema';
import { getJobPosts } from '../handlers/get_job_posts';

describe('getJobPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no job posts exist', async () => {
    const result = await getJobPosts();
    expect(result).toEqual([]);
  });

  it('should return all job posts ordered by creation date (newest first)', async () => {
    // Create a test user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple job posts with slight delays to ensure different timestamps
    const firstPost = await db.insert(jobPostsTable)
      .values({
        title: 'First Job',
        company_name: 'Test Company',
        description: 'First job description',
        location: 'Remote',
        job_type: 'full-time',
        tags: ['javascript', 'react'],
        employer_id: userId
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondPost = await db.insert(jobPostsTable)
      .values({
        title: 'Second Job',
        company_name: 'Test Company',
        description: 'Second job description',
        location: 'New York',
        job_type: 'part-time',
        tags: ['python', 'django'],
        employer_id: userId
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdPost = await db.insert(jobPostsTable)
      .values({
        title: 'Third Job',
        company_name: 'Test Company',
        description: 'Third job description',
        location: 'San Francisco',
        job_type: 'contract',
        tags: ['typescript', 'node'],
        employer_id: userId
      })
      .returning()
      .execute();

    const result = await getJobPosts();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first
    expect(result[0].title).toEqual('Third Job');
    expect(result[1].title).toEqual('Second Job');
    expect(result[2].title).toEqual('First Job');

    // Verify all fields are present
    result.forEach(jobPost => {
      expect(jobPost.id).toBeDefined();
      expect(jobPost.title).toBeDefined();
      expect(jobPost.company_name).toEqual('Test Company');
      expect(jobPost.description).toBeDefined();
      expect(jobPost.location).toBeDefined();
      expect(jobPost.job_type).toBeDefined();
      expect(Array.isArray(jobPost.tags)).toBe(true);
      expect(jobPost.employer_id).toEqual(userId);
      expect(jobPost.created_at).toBeInstanceOf(Date);
      expect(jobPost.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle multiple job posts from different employers', async () => {
    // Create two test users
    const firstUser = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword1',
        company_name: 'Company One'
      })
      .returning()
      .execute();

    const secondUser = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword2',
        company_name: 'Company Two'
      })
      .returning()
      .execute();

    // Create job posts from different employers
    await db.insert(jobPostsTable)
      .values({
        title: 'Job from Company One',
        company_name: 'Company One',
        description: 'Job description from first company',
        location: 'Boston',
        job_type: 'remote',
        tags: ['vue', 'javascript'],
        employer_id: firstUser[0].id
      })
      .execute();

    await db.insert(jobPostsTable)
      .values({
        title: 'Job from Company Two',
        company_name: 'Company Two',
        description: 'Job description from second company',
        location: 'Chicago',
        job_type: 'full-time',
        tags: ['react', 'typescript'],
        employer_id: secondUser[0].id
      })
      .execute();

    const result = await getJobPosts();

    expect(result).toHaveLength(2);
    
    // Verify both companies' posts are included
    const companyNames = result.map(post => post.company_name);
    expect(companyNames).toContain('Company One');
    expect(companyNames).toContain('Company Two');

    // Verify employer_id references are correct
    const employerIds = result.map(post => post.employer_id);
    expect(employerIds).toContain(firstUser[0].id);
    expect(employerIds).toContain(secondUser[0].id);
  });
});
