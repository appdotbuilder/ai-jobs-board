
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobPostsTable, jobApplicationsTable } from '../db/schema';
import { type CreateJobApplicationInput } from '../schema';
import { createJobApplication } from '../handlers/create_job_application';
import { eq } from 'drizzle-orm';

describe('createJobApplication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job application', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'employer@test.com',
        password_hash: 'hashedpassword123',
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    const employer = userResult[0];

    // Create prerequisite job post
    const jobPostResult = await db.insert(jobPostsTable)
      .values({
        title: 'Software Engineer',
        company_name: 'Test Company',
        description: 'A great job opportunity',
        location: 'Remote',
        job_type: 'full-time',
        tags: ['javascript', 'typescript'],
        employer_id: employer.id
      })
      .returning()
      .execute();

    const jobPost = jobPostResult[0];

    // Test input
    const testInput: CreateJobApplicationInput = {
      job_post_id: jobPost.id,
      applicant_name: 'John Doe',
      applicant_email: 'john@example.com',
      short_answer: 'I am very interested in this position and have 5 years of experience.'
    };

    const result = await createJobApplication(testInput);

    // Basic field validation
    expect(result.job_post_id).toEqual(jobPost.id);
    expect(result.applicant_name).toEqual('John Doe');
    expect(result.applicant_email).toEqual('john@example.com');
    expect(result.short_answer).toEqual(testInput.short_answer);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save job application to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'employer@test.com',
        password_hash: 'hashedpassword123',
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    const employer = userResult[0];

    // Create prerequisite job post
    const jobPostResult = await db.insert(jobPostsTable)
      .values({
        title: 'Software Engineer',
        company_name: 'Test Company',
        description: 'A great job opportunity',
        location: 'Remote',
        job_type: 'full-time',
        tags: ['javascript', 'typescript'],
        employer_id: employer.id
      })
      .returning()
      .execute();

    const jobPost = jobPostResult[0];

    const testInput: CreateJobApplicationInput = {
      job_post_id: jobPost.id,
      applicant_name: 'Jane Smith',
      applicant_email: 'jane@example.com',
      short_answer: 'I would love to work for your company.'
    };

    const result = await createJobApplication(testInput);

    // Query database to verify application was saved
    const applications = await db.select()
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.id, result.id))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].job_post_id).toEqual(jobPost.id);
    expect(applications[0].applicant_name).toEqual('Jane Smith');
    expect(applications[0].applicant_email).toEqual('jane@example.com');
    expect(applications[0].short_answer).toEqual(testInput.short_answer);
    expect(applications[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when job post does not exist', async () => {
    const testInput: CreateJobApplicationInput = {
      job_post_id: 999, // Non-existent job post ID
      applicant_name: 'John Doe',
      applicant_email: 'john@example.com',
      short_answer: 'I am interested in this position.'
    };

    await expect(createJobApplication(testInput)).rejects.toThrow(/job post with id 999 does not exist/i);
  });
});
