import { Client } from '@/lib/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const clientApi = createApi({
  reducerPath: 'clientApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: (builder) => ({
    getClients: builder.query<Client[], void>({
      query: () => 'client',
    }),
    addClient: builder.mutation<Client, Partial<Client>>({
      query: (body) => ({
        url: 'client',
        method: 'POST',
        body,
      }),
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
    }),
  }),
});

export const {
  useGetClientsQuery,
  useAddClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;
