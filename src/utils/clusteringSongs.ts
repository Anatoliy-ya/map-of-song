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

function randomCentroids(songs: Song[], k: number): Song[] {
  const centroids: Song[] = [];
  const songsCopy = [...songs];
  while (centroids.length < k && songsCopy.length > 0) {
    const randomIndex = Math.floor(Math.random() * songsCopy.length);
    centroids.push(songsCopy[randomIndex]);
    songsCopy.splice(randomIndex, 1);
  }
  return centroids;
}

export function clusteringSongs(songs: Song[], k: number, maxIterations: number = 50): Song[][] {
  const processedSongs = songs.map((song) => {
    const processedSong = { ...song };
    features.forEach((feature) => {
      if (processedSong[feature] === null || processedSong[feature] === undefined) {
        // @ts-ignore
        processedSong[feature] = 0;
      }
    });
    return processedSong;
  });

  let clusters: Song[][] = Array.from({ length: k }, () => []);
  let centroids: Song[] = randomCentroids(processedSongs, k);

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    clusters = clusters.map(() => []);

    // Assign songs to the nearest centroid
    for (const song of processedSongs) {
      const closestCentroidIndex = centroids.reduce(
        (minIndex, centroid, index, arr) =>
          euclideanDistance(song, centroid) < euclideanDistance(song, arr[minIndex])
            ? index
            : minIndex,
        0,
      );
      clusters[closestCentroidIndex].push(song);
    }

    // Compute new centroids
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

    const converged = newCentroids.every(
      (centroid, i) => euclideanDistance(centroid, centroids[i]) < 0.1,
    );
    if (converged) {
      console.log('Converged');
      break;
    }

    centroids = newCentroids;
  }

  return clusters;
}
