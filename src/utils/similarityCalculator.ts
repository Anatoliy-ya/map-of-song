import { Song } from '../types/types';
import { features } from '../constants/constants';

export function calculateCosineSimilarity(song1: Song, song2: Song): number {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const feature of features) {
    const value1 = typeof song1[feature] === 'number' ? (song1[feature] as number) : 0;
    const value2 = typeof song2[feature] === 'number' ? (song2[feature] as number) : 0;

    if (!isNaN(value1) && !isNaN(value2)) {
      dotProduct += value1 * value2;
      magnitude1 += value1 * value1;
      magnitude2 += value2 * value2;
    }
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

export function findSimilarSongs(targetSong: Song, allSongs: Song[], topN: number = 10): Song[] {
  const similarities = allSongs
    .filter((song) => song !== targetSong)
    .map((song) => ({
      song,
      similarity: calculateCosineSimilarity(targetSong, song),
    }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
    .map((item) => item.song);
}

export const calculateAllSimilarities = (songs: Song[]): Song[] => {
  const enhancedSongs = songs.map((song) => {
    const similarities = songs
      .filter((otherSong) => otherSong !== song)
      .map((otherSong) => ({
        id: otherSong.id,
        similarity: calculateCosineSimilarity(song, otherSong),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    return {
      ...song,
      similarities,
    };
  });

  return enhancedSongs;
};
