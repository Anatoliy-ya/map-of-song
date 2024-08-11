// api.ts
import axios from 'axios';
import { transformData } from '../utils/transformData';
import { Song } from '../types/Song';

const API_BASE_URL = 'http://localhost:3000';
const API_PUBLIC_URL = 'https://poor-heads-rush.loca.lt';

export const getAllSongs = async (): Promise<Song[]> => {
  try {
    const response = await axios.get(`${API_PUBLIC_URL}/songs`);
    console.log('Response data:', response.data);

    const rawSongsData = response.data;
    if (Array.isArray(rawSongsData)) {
      const transformedSongs = rawSongsData.map(transformData);
      return transformedSongs;
    } else {
      console.error('Data is not an array:', rawSongsData);
      throw new Error('Expected an array but got something else');
    }
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

export const getSongById = async (id: string): Promise<Song> => {
  return transformData(await axios.get(`${API_BASE_URL}/songs/${id}`));
};
