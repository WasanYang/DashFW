import { configureStore } from '@reduxjs/toolkit';
import { clientApi } from './services/clientApi';
import { projectApi } from './services/projectApi';

export const store = configureStore({
  reducer: {
    [clientApi.reducerPath]: clientApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(clientApi.middleware, projectApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
