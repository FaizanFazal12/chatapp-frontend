// src/features/api/commonApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const commonApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL+'/api', 
    credentials: 'include',
  }),
  tagTypes: ['Users', 'Messages', 'Groups'], 
  endpoints: (builder) => ({}),
});

export default commonApi;
