import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const taskTemplateApi = createApi({
  reducerPath: 'taskTemplateApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['TaskTemplate'],
  endpoints: (builder) => ({
    getTaskTemplates: builder.query<any[], void>({
      query: () => 'task-template',
      providesTags: ['TaskTemplate'],
    }),
    addTaskTemplate: builder.mutation<any, any>({
      query: (body) => ({
        url: 'task-template',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TaskTemplate'],
    }),
    updateTaskTemplate: builder.mutation<any, any>({
      query: (body) => ({
        url: 'task-template',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['TaskTemplate'],
    }),
    deleteTaskTemplate: builder.mutation<{ _id: string }, string>({
      query: (id) => ({
        url: `task-template?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TaskTemplate'],
    }),
  }),
});

export const {
  useGetTaskTemplatesQuery,
  useAddTaskTemplateMutation,
  useUpdateTaskTemplateMutation,
  useDeleteTaskTemplateMutation,
} = taskTemplateApi;
