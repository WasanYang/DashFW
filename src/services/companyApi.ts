import { Company } from '@/lib/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const companyApi = createApi({
  reducerPath: 'companyApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Company'],
  endpoints: (builder) => ({
    getCompanies: builder.query<Company[], void>({
      query: () => 'company',
      providesTags: ['Company'],
    }),
    addCompany: builder.mutation<Company, Partial<Company>>({
      query: (body) => ({
        url: 'company',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Company'],
    }),
    updateCompany: builder.mutation<
      { message: string; modifiedCount: number },
      { _id: string; data: Partial<Company> }
    >({
      query: ({ _id, data }) => ({
        url: 'company',
        method: 'PUT',
        body: { _id, ...data },
      }),
      invalidatesTags: ['Company'],
    }),
    deleteCompany: builder.mutation<
      { message: string; deletedCount: number },
      { _id: string }
    >({
      query: ({ _id }) => ({
        url: 'company',
        method: 'DELETE',
        body: { _id },
      }),
      invalidatesTags: ['Company'],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useAddCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companyApi;
