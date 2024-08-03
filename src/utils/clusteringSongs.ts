import { Song } from '../types/Song';
import { features } from '../constants/constants';

function euclideanDistance(song1: Song, song2: Song): number {
  return Math.sqrt(
    features.reduce((sum, feature) => {
      const value1 = typeof song1[feature] === 'number' ? (song1[feature] as number) : 0;
      const value2 = typeof song2[feature] === 'number' ? (song2[feature] as number) : 0;
      return sum + Math.pow(value1 - value2, 2);
    }, 0),
  );
}

export function clusteringSongs(songs: Song[], k: number, maxIterations: number = 100): Song[][] {
  let clusters: Song[][] = Array.from({ length: k }, () => []);
  let centroids: Song[] = songs.slice(0, k);
  console.log('@clusters', clusters);
  console.log('@centroids', centroids);
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    clusters = clusters.map(() => []);

    for (const song of songs) {
      const closestCentroidIndex = centroids.reduce(
        (minIndex, centroid, index, arr) =>
          euclideanDistance(song, centroid) < euclideanDistance(song, arr[minIndex])
            ? index
            : minIndex,
        0,
      );
      clusters[closestCentroidIndex].push(song);
    }

    const newCentroids = clusters.map((cluster, i) => {
      if (cluster.length === 0) return centroids[i];
      const centroid: Partial<Song> = {};

      features.forEach((feature) => {
        const sum = cluster.reduce(
          (acc, song) => acc + (typeof song[feature] === 'number' ? (song[feature] as number) : 0),
          0,
        );
        // @ts-ignore
        centroid[feature] = sum / cluster.length;
      });

      return centroid as Song;
    });

    if (newCentroids.every((centroid, i) => euclideanDistance(centroid, centroids[i]) < 0.001)) {
      break;
    }

    centroids = newCentroids;
  }

  return clusters;
}
