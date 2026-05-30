import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Proposal } from '@/lib/types';

export const proposalApi = createApi({
  reducerPath: 'proposalApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Proposal'],
  endpoints: (builder) => ({
    getProposals: builder.query<Proposal[], void>({
      query: () => 'proposal',
      providesTags: ['Proposal'],
    }),
    addProposal: builder.mutation<any, Partial<Proposal>>({
      query: (body) => ({
        url: 'proposal',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Proposal'],
    }),
    updateProposal: builder.mutation<any, { id: string; data: Partial<Proposal> }>({
      query: ({ id, data }) => ({
        url: 'proposal',
        method: 'PUT',
        body: { id, ...data },
      }),
      invalidatesTags: ['Proposal'],
    }),
    deleteProposal: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: 'proposal',
        method: 'DELETE',
        body: { id },
      }),
      invalidatesTags: ['Proposal'],
    }),
  }),
});

export const {
  useGetProposalsQuery,
  useAddProposalMutation,
  useUpdateProposalMutation,
  useDeleteProposalMutation,
} = proposalApi;
