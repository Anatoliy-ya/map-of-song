import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Song, Link, Node, SongWithSimilarities } from '../types/types';
import { getAllSongs } from '../api/api';

export interface SongsState {
  songs: Song[];
  loading: boolean;
  error?: string | null;
  processedSongs: SongWithSimilarities[];
  nodes: Node[];
  links: Link[];
}

const initialState: SongsState = {
  songs: [],
  loading: false,
  error: null,
  processedSongs: [], // Изначально массивы пусты
  nodes: [],
  links: [],
};

export const fetchAllSongs = createAsyncThunk('songs/fetchAllSongs', async () => {
  const response = await getAllSongs();
  console.log('response', response);
  return response;
});

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    // Редьюсер для сохранения обработанных песен
    setProcessedSongs(state, action: PayloadAction<SongWithSimilarities[]>) {
      state.processedSongs = action.payload;
    },
    // Редьюсер для сохранения узлов
    setNodes(state, action: PayloadAction<Node[]>) {
      state.nodes = action.payload;
    },
    // Редьюсер для сохранения связей
    setLinks(state, action: PayloadAction<Link[]>) {
      state.links = action.payload;
    },
  },
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

// Экспортируем экшены и редьюсер
export const { setProcessedSongs, setNodes, setLinks } = songsSlice.actions;
export const songsReducer = songsSlice.reducer;
