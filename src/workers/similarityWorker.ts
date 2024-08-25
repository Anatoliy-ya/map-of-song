import { Song } from '../types/types';
import { calculateCosineSimilarity, findSimilarSongs } from '../utils/similarityCalculator';
import { clusteringSongs } from '../utils/clusteringSongs';

export interface SongWithSimilarities extends Song {
  similarities: {
    id: string;
    similarity: number;
  }[];
}
console.log('@worker');
self.onmessage = (event: MessageEvent<Song[]>) => {
  const clusters = clusteringSongs(event.data, Math.floor(Math.sqrt(event.data.length)));
  console.log('@clusters worker', clusters);
  const results: SongWithSimilarities[] = clusters.flatMap((cluster) => {
    return cluster.map((song) => ({
      ...song,
      similarities: findSimilarSongs(song, cluster, 10).map((similarSong) => ({
        id: similarSong.id,
        similarity: calculateCosineSimilarity(song, similarSong),
      })),
    }));
  });
  console.log('@results worker', results);
  self.postMessage(results);
};
