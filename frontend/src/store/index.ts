import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

/**
 * Safe storage wrapper for SSR compatibility
 * Falls back to noop storage on server-side
 */
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem() {
      return Promise.resolve();
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

const safeStorage = typeof window !== 'undefined' ? storage : createNoopStorage();
import uiSlice from './slices/uiSlice';
import preferencesSlice from './slices/preferencesSlice';
import draftsSlice from './slices/draftsSlice';

/**
 * Root reducer combining all slices
 */
const rootReducer = combineReducers({
  ui: uiSlice,
  preferences: preferencesSlice,
  drafts: draftsSlice,
});

/**
 * Redux persist configuration
 * Only persists user preferences, not temporary UI state
 */
const persistConfig = {
  key: 'fintrack',
  storage: safeStorage,
  whitelist: ['preferences'], // Only persist preferences
  blacklist: ['ui', 'drafts'], // Don't persist temporary state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure Redux store with RTK and persistence
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['_persist'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;