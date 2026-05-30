import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { JobType } from '@/lib/types';

export const jobTypeApi = createApi({
  reducerPath: 'jobTypeApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['JobType'],
  endpoints: (builder) => ({
    getJobTypes: builder.query<JobType[], void>({
      query: () => 'job-type',
      providesTags: ['JobType'],
    }),
    addJobType: builder.mutation<JobType, Partial<JobType>>({
      query: (body) => ({
        url: 'job-type',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['JobType'],
    }),
    updateJobType: builder.mutation<JobType, Partial<JobType>>({
      query: (body) => ({
        url: 'job-type',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['JobType'],
    }),
    deleteJobType: builder.mutation<{ _id: string }, string>({
      query: (id) => ({
        url: `job-type?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['JobType'],
    }),
  }),
});

export const {
  useGetJobTypesQuery,
  useAddJobTypeMutation,
  useUpdateJobTypeMutation,
  useDeleteJobTypeMutation,
} = jobTypeApi;

