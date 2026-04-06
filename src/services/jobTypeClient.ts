import { JobType } from '@/app/(protect)/job-types/page';

export async function fetchJobTypes(): Promise<JobType[]> {
  const res = await fetch('/api/job-type');
  return res.json();
}
