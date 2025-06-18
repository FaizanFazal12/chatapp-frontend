// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import { commonApi } from './api/commonApi';

export const store = configureStore({
  reducer: {
[commonApi.reducerPath]: commonApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(commonApi.middleware),
});
