import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Project } from '@/lib/types';

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => 'task',
    }),
    addProject: builder.mutation<Project, Partial<Project>>({
      query: (body) => ({
        url: 'task',
        method: 'POST',
        body,
      }),
    }),
    updateProject: builder.mutation<
      { message: string; modifiedCount: number },
      { id: string; data: Partial<Project> }
    >({
      query: ({ id, data }) => ({
        url: 'task',
        method: 'PUT',
        body: { id, ...data },
      }),
    }),
    deleteProject: builder.mutation<
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
  useGetProjectsQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
