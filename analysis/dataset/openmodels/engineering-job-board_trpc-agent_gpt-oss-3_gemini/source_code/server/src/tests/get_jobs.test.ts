import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type GetJobsInput, type EngineeringDiscipline } from '../schema';
import { type NewJob } from '../db/schema';
import { getJobs } from '../handlers/get_jobs';

// Helper to insert a job directly for test setup
const insertJob = async (job: Omit<NewJob, 'id' | 'created_at'>) => {
  const [result] = await db
    .insert(jobsTable)
    .values(job)
    .returning();
  return result;
};

describe('getJobs handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all jobs when no filters are provided', async () => {
    await insertJob({
      title: 'Engineer 1',
      company: 'Acme Corp',
      location: 'New York',
      discipline: 'Software' as EngineeringDiscipline,
      description: 'Job description 1',
      application_contact: 'hr@acme.com',
    });
    await insertJob({
      title: 'Engineer 2',
      company: 'Beta LLC',
      location: 'San Francisco',
      discipline: 'Electrical' as EngineeringDiscipline,
      description: 'Job description 2',
      application_contact: 'jobs@beta.com',
    });

    const jobs = await getJobs();
    expect(jobs).toHaveLength(2);
  });

  it('filters by discipline correctly', async () => {
    await insertJob({
      title: 'Software Engineer',
      company: 'TechCo',
      location: 'Remote',
      discipline: 'Software' as EngineeringDiscipline,
      description: 'Develop software',
      application_contact: 'contact@techco.com',
    });
    await insertJob({
      title: 'Electrical Engineer',
      company: 'PowerInc',
      location: 'Remote',
      discipline: 'Electrical' as EngineeringDiscipline,
      description: 'Design circuits',
      application_contact: 'hr@powerinc.com',
    });

    const input: GetJobsInput = { discipline: 'Software' as EngineeringDiscipline };
    const jobs = await getJobs(input);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].discipline).toBe('Software');
  });

  it('filters by location correctly', async () => {
    await insertJob({
      title: 'Job A',
      company: 'Company A',
      location: 'Boston',
      discipline: 'Mechanical' as EngineeringDiscipline,
      description: 'Desc A',
      application_contact: 'a@comp.com',
    });
    await insertJob({
      title: 'Job B',
      company: 'Company B',
      location: 'Boston',
      discipline: 'Civil' as EngineeringDiscipline,
      description: 'Desc B',
      application_contact: 'b@comp.com',
    });
    await insertJob({
      title: 'Job C',
      company: 'Company C',
      location: 'Chicago',
      discipline: 'Civil' as EngineeringDiscipline,
      description: 'Desc C',
      application_contact: 'c@comp.com',
    });

    const input: GetJobsInput = { location: 'Boston' };
    const jobs = await getJobs(input);
    expect(jobs).toHaveLength(2);
    jobs.forEach(job => expect(job.location).toBe('Boston'));
  });

  it('applies both discipline and location filters together', async () => {
    await insertJob({
      title: 'Job 1',
      company: 'Co1',
      location: 'LA',
      discipline: 'Software' as EngineeringDiscipline,
      description: 'Desc1',
      application_contact: '1@co.com',
    });
    await insertJob({
      title: 'Job 2',
      company: 'Co2',
      location: 'LA',
      discipline: 'Electrical' as EngineeringDiscipline,
      description: 'Desc2',
      application_contact: '2@co.com',
    });

    const input: GetJobsInput = { discipline: 'Software' as EngineeringDiscipline, location: 'LA' };
    const jobs = await getJobs(input);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].discipline).toBe('Software');
    expect(jobs[0].location).toBe('LA');
  });
});
