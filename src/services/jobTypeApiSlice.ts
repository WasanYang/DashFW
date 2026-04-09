import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { JobType } from '@/app/(protect)/job-types/page';

export const jobTypeApi = createApi({
  reducerPath: 'jobTypeApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: (builder) => ({
    getJobTypes: builder.query<JobType[], void>({
      query: () => 'job-type',
    }),
  }),
});

export const { useGetJobTypesQuery } = jobTypeApi;
