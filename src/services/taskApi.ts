import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Task } from '@/lib/types';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => 'task',
    }),
    addTask: builder.mutation<Task, Partial<Task>>({
      query: (body) => ({
        url: 'task',
        method: 'POST',
        body,
      }),
    }),
    updateTask: builder.mutation<
      { message: string; modifiedCount: number },
      { id: string; data: Partial<Task> }
    >({
      query: ({ id, data }) => ({
        url: 'task',
        method: 'PUT',
        body: { id, ...data },
      }),
    }),
    deleteTask: builder.mutation<
      { message: string; deletedCount: number },
      { id: string }
    >({
      query: ({ id }) => ({
        url: 'task',
        method: 'DELETE',
        body: { id },
      }),
    }),
  }),
});

export const {
  useGetTasksQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
