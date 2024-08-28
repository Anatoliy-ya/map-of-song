import { applyMiddleware, configureStore } from '@reduxjs/toolkit';
import { songsReducer, SongsState } from './songsSlice';

export const store = configureStore({
  reducer: {
    songs: songsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type SongsStateType = SongsState;
