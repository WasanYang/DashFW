import { JobType } from '@/lib/types';

export async function fetchJobTypes(): Promise<JobType[]> {
  const res = await fetch('/api/job-type');
  return res.json();
}
