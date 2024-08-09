import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Song } from '../types/Song';
import { getAllSongs } from '../api/api';

export interface SongsState {
  songs: Song[];
  loading: boolean;
  error?: string | null;
}

const initialState: SongsState = {
  songs: [],
  loading: false,
  error: null,
};

export const fetchAllSongs = createAsyncThunk('songs/fetchAllSongs', async () => {
  const response = await getAllSongs();
  console.log('response', response);
  return response;
});

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSongs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSongs.fulfilled, (state, action) => {
        state.songs = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllSongs.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch songs';
        state.loading = false;
      });
  },
});

export const { reducer } = songsSlice;
export const songsReducer = songsSlice.reducer;
