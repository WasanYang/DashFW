import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Project } from '@/lib/types';

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => 'project',
      providesTags: ['Project'],
    }),
    addProject: builder.mutation<Project, Partial<Project>>({
      query: (body) => ({
        url: 'project',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<
      { message: string; modifiedCount: number },
      { id: string; data: Partial<Project> }
    >({
      query: ({ id, data }) => ({
        url: 'project',
        method: 'PUT',
        body: { id, ...data },
      }),
      invalidatesTags: ['Project'],
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          projectApi.util.updateQueryData('getProjects', undefined, (draft) => {
            const project = draft.find((p) => p.id === id);
            if (project) {
              Object.assign(project, data);
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
    deleteProject: builder.mutation<
      { message: string; deletedCount: number },
      { id: string }
    >({
      query: ({ id }) => ({
        url: 'project',
        method: 'DELETE',
        body: { id },
      }),
      invalidatesTags: ['Project'],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          projectApi.util.updateQueryData('getProjects', undefined, (draft) => {
            const index = draft.findIndex((p) => p.id === id);
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
  useGetProjectsQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
