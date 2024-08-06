import { AppDispatch } from '../store/store';
import { setSongs } from '../store/songsSlice';
import { parseCSV } from '../utils/dataLoader';

export const loadSongs = (filePath: string) => async (dispatch: AppDispatch) => {
  try {
    const songs = await parseCSV(filePath);
    console.log('@songs after parse', songs);
    dispatch(setSongs(songs));
  } catch (error) {
    console.error('Failed to load and parse CSV:', error);
  }
};
