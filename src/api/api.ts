// api.ts
import axios from 'axios';
import { transformData } from '../utils/transformData';
import { Song } from '../types/Song'; // Если у вас есть определение типа Song в отдельном файле

const API_BASE_URL = 'http://localhost:3000';

export const getAllSongs = async (): Promise<Song[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/songs`);
    const rawSongsData = response.data;

    // Применяем transformData ко всем элементам массива
    const transformedSongs = rawSongsData.map(transformData);
    console.log('@transformedSongs', transformedSongs);
    return transformedSongs;
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error; // Можете обработать ошибку более детально, если нужно
  }
};

export const getSongById = async (id: string): Promise<Song> => {
  return transformData(await axios.get(`${API_BASE_URL}/songs/${id}`));
};
