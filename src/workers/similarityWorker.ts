import { Song } from '../types/Song';
import { calculateCosineSimilarity, findSimilarSongs } from '../utils/similarityCalculator';
import { clusteringSongs } from '../utils/clusteringSongs';

export interface SongWithSimilarities extends Song {
  similarities: {
    isrc: string;
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
        isrc: similarSong.isrc,
        similarity: calculateCosineSimilarity(song, similarSong),
      })),
    }));
  });
  console.log('@results worker', results);
  self.postMessage(results);
};
