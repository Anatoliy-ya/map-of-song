import { Song } from '../types/Song';
import { mapHeaderToKey } from '../constants/constants';
import { features } from '../constants/constants';

export async function parseCSV(filePath: string): Promise<Song[]> {
  console.log('parseCSV', filePath);
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const text = await response.text();

    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new Error('CSV file is empty or only contains whitespace.');
    }

    const headers = lines[0].split(',').map((header) => header.trim());
    console.log('CSV headers:', headers);

    const songs: Song[] = lines.slice(1).map((line) => {
      const values = line.split(',').map((value) => value.trim());
      const song: Partial<Song> = {};

      headers.forEach((header, index) => {
        const key = mapHeaderToKey[header];
        if (key) {
          song[key] = parseValue(values[index], key);
        }
      });

      if (typeof song.track !== 'string' || typeof song.artist !== 'string') {
        console.warn(`Invalid data format for song:`, song);
      }

      return song as Song;
    });

    return songs;
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    throw new Error('Failed to parse CSV file.');
  }
}

function parseValue(value: string | undefined, key: keyof Song): any {
  if (value === undefined) {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return null;
  }

  if (key === 'isExplicit') {
    return trimmedValue.toLowerCase() === 'true';
  }

  if (features.includes(key)) {
    return Number(trimmedValue);
  }

  if (key === 'releaseDate') {
    const date = new Date(trimmedValue);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  return trimmedValue;
}
