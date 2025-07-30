
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobPostsTable } from '../db/schema';
import { getEmployerJobPosts } from '../handlers/get_employer_job_posts';

describe('getEmployerJobPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when employer has no job posts', async () => {
    // Create employer
    const [employer] = await db.insert(usersTable)
      .values({
        email: 'employer@test.com',
        password_hash: 'hash123',
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    const result = await getEmployerJobPosts(employer.id);

    expect(result).toEqual([]);
  });

  it('should return job posts for specific employer', async () => {
    // Create employer
    const [employer] = await db.insert(usersTable)
      .values({
        email: 'employer@test.com',
        password_hash: 'hash123',
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    // Create job posts
    await db.insert(jobPostsTable)
      .values([
        {
          title: 'Software Engineer',
          company_name: 'Test Company',
          description: 'Great job opportunity',
          location: 'San Francisco',
          job_type: 'full-time',
          tags: ['javascript', 'react'],
          employer_id: employer.id
        },
        {
          title: 'Product Manager',
          company_name: 'Test Company',
          description: 'Lead product development',
          location: 'Remote',
          job_type: 'remote',
          tags: ['product', 'management'],
          employer_id: employer.id
        }
      ])
      .execute();

    const result = await getEmployerJobPosts(employer.id);

    expect(result).toHaveLength(2);
    
    // Check first job post
    const softwareJob = result.find(job => job.title === 'Software Engineer');
    expect(softwareJob).toBeDefined();
    expect(softwareJob!.company_name).toEqual('Test Company');
    expect(softwareJob!.description).toEqual('Great job opportunity');
    expect(softwareJob!.location).toEqual('San Francisco');
    expect(softwareJob!.job_type).toEqual('full-time');
    expect(softwareJob!.tags).toEqual(['javascript', 'react']);
    expect(softwareJob!.employer_id).toEqual(employer.id);
    expect(softwareJob!.id).toBeDefined();
    expect(softwareJob!.created_at).toBeInstanceOf(Date);
    expect(softwareJob!.updated_at).toBeInstanceOf(Date);

    // Check second job post
    const productJob = result.find(job => job.title === 'Product Manager');
    expect(productJob).toBeDefined();
    expect(productJob!.job_type).toEqual('remote');
    expect(productJob!.tags).toEqual(['product', 'management']);
  });

  it('should only return job posts for specified employer', async () => {
    // Create two employers
    const [employer1] = await db.insert(usersTable)
      .values({
        email: 'employer1@test.com',
        password_hash: 'hash123',
        company_name: 'Company 1'
      })
      .returning()
      .execute();

    const [employer2] = await db.insert(usersTable)
      .values({
        email: 'employer2@test.com',
        password_hash: 'hash456',
        company_name: 'Company 2'
      })
      .returning()
      .execute();

    // Create job posts for both employers
    await db.insert(jobPostsTable)
      .values([
        {
          title: 'Job for Employer 1',
          company_name: 'Company 1',
          description: 'Job description',
          location: 'Location 1',
          job_type: 'full-time',
          tags: ['tag1'],
          employer_id: employer1.id
        },
        {
          title: 'Job for Employer 2',
          company_name: 'Company 2',
          description: 'Job description',
          location: 'Location 2',
          job_type: 'part-time',
          tags: ['tag2'],
          employer_id: employer2.id
        }
      ])
      .execute();

    const result = await getEmployerJobPosts(employer1.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Job for Employer 1');
    expect(result[0].employer_id).toEqual(employer1.id);
  });

  it('should return empty array for non-existent employer', async () => {
    const result = await getEmployerJobPosts(99999);

    expect(result).toEqual([]);
  });
});
