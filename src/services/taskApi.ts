import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Task } from '@/lib/types';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => 'task',
      providesTags: ['Task'],
    }),
    addTask: builder.mutation<Task, Partial<Task>>({
      query: (body) => ({
        url: 'task',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    addTasksBulk: builder.mutation<
      { message: string; count: number },
      Partial<Task>[]
    >({
      query: (body) => ({
        url: 'task',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
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
      invalidatesTags: ['Task'],
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const task = draft.find((t) => t.id === id);
            if (task) {
              Object.assign(task, data);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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
      invalidatesTags: ['Task'],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const index = draft.findIndex((t) => t.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetTasksQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAddTasksBulkMutation,
} = taskApi;
