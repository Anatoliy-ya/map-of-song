import { parseCSV } from '../utils/dataLoader';

export const loadSongs = (filePath: string) => async () => {
  try {
    const songs = await parseCSV(filePath);
    console.log('@songs after parse', songs);
  } catch (error) {
    console.error('Failed to load and parse CSV:', error);
  }
};
