import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Snippet } from '@/lib/types';

export const snippetApi = createApi({
  reducerPath: 'snippetApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Snippet'],
  endpoints: (builder) => ({
    getSnippets: builder.query<Snippet[], void>({
      query: () => 'snippet',
      providesTags: ['Snippet'],
    }),
    addSnippet: builder.mutation<Snippet, Partial<Snippet>>({
      query: (body) => ({
        url: 'snippet',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Snippet'],
    }),
    updateSnippet: builder.mutation<Snippet, { id: string; data: Partial<Snippet> }>({
      query: ({ id, data }) => ({
        url: 'snippet',
        method: 'PUT',
        body: { id, ...data },
      }),
      invalidatesTags: ['Snippet'],
    }),
    deleteSnippet: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `snippet?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Snippet'],
    }),
  }),
});

export const {
  useGetSnippetsQuery,
  useAddSnippetMutation,
  useUpdateSnippetMutation,
  useDeleteSnippetMutation,
} = snippetApi;
