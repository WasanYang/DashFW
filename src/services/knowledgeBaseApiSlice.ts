import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { KnowledgeBaseArticle } from '@/lib/types';

export const knowledgeBaseApi = createApi({
  reducerPath: 'knowledgeBaseApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['KnowledgeBase'],
  endpoints: (builder) => ({
    getArticles: builder.query<KnowledgeBaseArticle[], void>({
      query: () => 'knowledge-base',
      providesTags: ['KnowledgeBase'],
    }),
    addArticle: builder.mutation<KnowledgeBaseArticle, Partial<KnowledgeBaseArticle>>({
      query: (body) => ({
        url: 'knowledge-base',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KnowledgeBase'],
    }),
    updateArticle: builder.mutation<KnowledgeBaseArticle, { id: string; data: Partial<KnowledgeBaseArticle> }>({
      query: ({ id, data }) => ({
        url: 'knowledge-base',
        method: 'PUT',
        body: { id, ...data },
      }),
      invalidatesTags: ['KnowledgeBase'],
    }),
    deleteArticle: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `knowledge-base?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['KnowledgeBase'],
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useAddArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
} = knowledgeBaseApi;
