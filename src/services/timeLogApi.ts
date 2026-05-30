import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { TimeLog } from '@/lib/types';

export const timeLogApi = createApi({
  reducerPath: 'timeLogApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['TimeLog'],
  endpoints: (builder) => ({
    getTimeLogs: builder.query<TimeLog[], void>({
      query: () => 'time-log',
      providesTags: ['TimeLog'],
    }),
    addTimeLog: builder.mutation<any, Partial<TimeLog>>({
      query: (body) => ({
        url: 'time-log',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TimeLog'],
    }),
    deleteTimeLog: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: 'time-log',
        method: 'DELETE',
        body: { id },
      }),
      invalidatesTags: ['TimeLog'],
    }),
  }),
});

export const {
  useGetTimeLogsQuery,
  useAddTimeLogMutation,
  useDeleteTimeLogMutation,
} = timeLogApi;
