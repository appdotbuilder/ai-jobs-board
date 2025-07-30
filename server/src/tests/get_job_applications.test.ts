
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobPostsTable, jobApplicationsTable } from '../db/schema';
import { type GetJobApplicationsInput, type CreateUserInput, type CreateJobPostInput, type CreateJobApplicationInput } from '../schema';
import { getJobApplications } from '../handlers/get_job_applications';

// Test data
const testUser: CreateUserInput = {
  email: 'employer@test.com',
  password: 'password123',
  company_name: 'Test Company'
};

const otherUser: CreateUserInput = {
  email: 'other@test.com',
  password: 'password123',
  company_name: 'Other Company'
};

const testJobPost: CreateJobPostInput = {
  title: 'Software Engineer',
  company_name: 'Test Company',
  description: 'We are looking for a software engineer',
  location: 'Remote',
  job_type: 'full-time',
  tags: ['javascript', 'react'],
  employer_id: 1 // Will be set after user creation
};

const testApplication: CreateJobApplicationInput = {
  job_post_id: 1, // Will be set after job post creation
  applicant_name: 'John Doe',
  applicant_email: 'john@example.com',
  short_answer: 'I am very interested in this position'
};

describe('getJobApplications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return applications for job post owned by employer', async () => {
    // Create employer
    const [employer] = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        company_name: testUser.company_name
      })
      .returning()
      .execute();

    // Create job post
    const [jobPost] = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        employer_id: employer.id
      })
      .returning()
      .execute();

    // Create application
    await db.insert(jobApplicationsTable)
      .values({
        ...testApplication,
        job_post_id: jobPost.id
      })
      .execute();

    const input: GetJobApplicationsInput = {
      job_post_id: jobPost.id,
      employer_id: employer.id
    };

    const result = await getJobApplications(input);

    expect(result).toHaveLength(1);
    expect(result[0].job_post_id).toEqual(jobPost.id);
    expect(result[0].applicant_name).toEqual('John Doe');
    expect(result[0].applicant_email).toEqual('john@example.com');
    expect(result[0].short_answer).toEqual('I am very interested in this position');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple applications for the same job post', async () => {
    // Create employer
    const [employer] = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        company_name: testUser.company_name
      })
      .returning()
      .execute();

    // Create job post
    const [jobPost] = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        employer_id: employer.id
      })
      .returning()
      .execute();

    // Create multiple applications
    await db.insert(jobApplicationsTable)
      .values([
        {
          job_post_id: jobPost.id,
          applicant_name: 'John Doe',
          applicant_email: 'john@example.com',
          short_answer: 'First application'
        },
        {
          job_post_id: jobPost.id,
          applicant_name: 'Jane Smith',
          applicant_email: 'jane@example.com',
          short_answer: 'Second application'
        }
      ])
      .execute();

    const input: GetJobApplicationsInput = {
      job_post_id: jobPost.id,
      employer_id: employer.id
    };

    const result = await getJobApplications(input);

    expect(result).toHaveLength(2);
    expect(result.map(app => app.applicant_name)).toContain('John Doe');
    expect(result.map(app => app.applicant_name)).toContain('Jane Smith');
  });

  it('should return empty array when employer does not own the job post', async () => {
    // Create two employers
    const [employer1] = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        company_name: testUser.company_name
      })
      .returning()
      .execute();

    const [employer2] = await db.insert(usersTable)
      .values({
        email: otherUser.email,
        password_hash: 'hashed_password',
        company_name: otherUser.company_name
      })
      .returning()
      .execute();

    // Create job post owned by employer1
    const [jobPost] = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        employer_id: employer1.id
      })
      .returning()
      .execute();

    // Create application
    await db.insert(jobApplicationsTable)
      .values({
        ...testApplication,
        job_post_id: jobPost.id
      })
      .execute();

    // Try to get applications as employer2
    const input: GetJobApplicationsInput = {
      job_post_id: jobPost.id,
      employer_id: employer2.id // Different employer
    };

    const result = await getJobApplications(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when job post has no applications', async () => {
    // Create employer
    const [employer] = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        company_name: testUser.company_name
      })
      .returning()
      .execute();

    // Create job post
    const [jobPost] = await db.insert(jobPostsTable)
      .values({
        ...testJobPost,
        employer_id: employer.id
      })
      .returning()
      .execute();

    const input: GetJobApplicationsInput = {
      job_post_id: jobPost.id,
      employer_id: employer.id
    };

    const result = await getJobApplications(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when job post does not exist', async () => {
    // Create employer
    const [employer] = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        company_name: testUser.company_name
      })
      .returning()
      .execute();

    const input: GetJobApplicationsInput = {
      job_post_id: 999, // Non-existent job post
      employer_id: employer.id
    };

    const result = await getJobApplications(input);

    expect(result).toHaveLength(0);
  });
});
