import { configureStore } from '@reduxjs/toolkit';
import { clientApi } from './services/clientApi';
import { projectApi } from './services/projectApi';
import { taskApi } from './services/taskApi';
import { jobTypeApi } from './services/jobTypeApiSlice';
import { snippetApi } from './services/snippetApiSlice';
import { timeLogApi } from './services/timeLogApi';
import { invoiceApi } from './services/invoiceApi';
import { proposalApi } from './services/proposalApi';
import { companyApi } from './services/companyApi';

export const store = configureStore({
  reducer: {
    [clientApi.reducerPath]: clientApi.reducer,
    [jobTypeApi.reducerPath]: jobTypeApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [snippetApi.reducerPath]: snippetApi.reducer,
    [timeLogApi.reducerPath]: timeLogApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [proposalApi.reducerPath]: proposalApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      clientApi.middleware,
      jobTypeApi.middleware,
      projectApi.middleware,
      taskApi.middleware,
      snippetApi.middleware,
      timeLogApi.middleware,
      invoiceApi.middleware,
      proposalApi.middleware,
      companyApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
