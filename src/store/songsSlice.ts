import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Song } from '../types/Song';

export interface SongsState {
  songs: Song[];
}

const initialState: SongsState = {
  songs: [],
};

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    setSongs(state, action: PayloadAction<Song[]>) {
      console.log('action', action);
      state.songs = action.payload;
    },
  },
});

export const { setSongs } = songsSlice.actions;
export const songsReducer = songsSlice.reducer;
