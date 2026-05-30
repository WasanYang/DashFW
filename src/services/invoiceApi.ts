import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Invoice } from '@/lib/types';

export const invoiceApi = createApi({
  reducerPath: 'invoiceApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Invoice'],
  endpoints: (builder) => ({
    getInvoices: builder.query<Invoice[], void>({
      query: () => 'invoice',
      providesTags: ['Invoice'],
    }),
    addInvoice: builder.mutation<any, Partial<Invoice>>({
      query: (body) => ({
        url: 'invoice',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice'],
    }),
    updateInvoice: builder.mutation<any, { id: string; data: Partial<Invoice> }>({
      query: ({ id, data }) => ({
        url: 'invoice',
        method: 'PUT',
        body: { id, ...data },
      }),
      invalidatesTags: ['Invoice'],
    }),
    deleteInvoice: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: 'invoice',
        method: 'DELETE',
        body: { id },
      }),
      invalidatesTags: ['Invoice'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useAddInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = invoiceApi;
