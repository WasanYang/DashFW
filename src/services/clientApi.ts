import { Client } from '@/lib/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const clientApi = createApi({
  reducerPath: 'clientApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Client'],
  endpoints: (builder) => ({
    getClients: builder.query<Client[], void>({
      query: () => 'client',
      providesTags: ['Client'],
    }),
    addClient: builder.mutation<Client, Partial<Client>>({
      query: (body) => ({
        url: 'client',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Client'],
    }),
    updateClient: builder.mutation<
      { message: string; modifiedCount: number },
      { _id: string; data: Partial<Client> }
    >({
      query: ({ _id, data }) => ({
        url: 'client',
        method: 'PUT',
        body: { _id, ...data },
      }),
      invalidatesTags: ['Client'],
    }),
    deleteClient: builder.mutation<
      { message: string; deletedCount: number },
      { _id: string }
    >({
      query: ({ _id }) => ({
        url: 'client',
        method: 'DELETE',
        body: { _id },
      }),
      invalidatesTags: ['Client'],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useAddClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;
