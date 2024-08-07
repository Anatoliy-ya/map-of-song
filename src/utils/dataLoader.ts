import { Song } from '../types/Song';
import { mapHeaderToKey, features } from '../constants/constants';

export async function parseCSV(filePath: string): Promise<Song[]> {
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

      // Заменяем null и NaN на 0
      features.forEach((feature) => {
        if ((song[feature] === null || song[feature] === undefined, Number.isNaN(song[feature]))) {
          song[feature] = 0 as any;
        }
      });

      return song as Song;
    });

    // Вычисляем средние значения для каждого числового признака
    const averages = features.reduce((acc, feature) => {
      const values = songs.map((song) => song[feature] as number).filter((value) => value !== 0);
      acc[feature] =
        values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
      return acc;
    }, {} as Record<keyof Song, number>);

    // Заменяем нулевые значения на средние
    songs.forEach((song) => {
      features.forEach((feature) => {
        if (song[feature] === 0) {
          // @ts-ignore
          song[feature] = averages[feature];
        }
      });
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
    return Number(trimmedValue) || null;
  }

  if (key === 'releaseDate') {
    const date = new Date(trimmedValue);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  return trimmedValue;
}
