import React, { useEffect, useRef, useState } from 'react';
import './SimilarityMap.css';
import { Song } from '../../types/Song';
import similarityWorker from '../../workers/similarityWorker.ts?worker';

interface SongWithSimilarities extends Song {
  similarities: {
    isrc: string;
    similarity: number;
  }[];
}

interface SimilarityMapProps {
  songs: Song[];
}

export const SimilarityMap: React.FC<SimilarityMapProps> = ({ songs }) => {
  const [processedSongs, setProcessedSongs] = useState<SongWithSimilarities[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  console.log('@songs', songs);
  console.log('@processedSongs', processedSongs);

  useEffect(() => {
    workerRef.current = new similarityWorker();
    workerRef.current.onmessage = (event: MessageEvent<SongWithSimilarities[]>) => {
      console.log('@onmessage', event.data);
      setProcessedSongs(event.data);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (workerRef.current && songs.length > 0) {
      // Логируем данные песен перед отправкой в воркер
      console.log('Sending songs to worker:', songs);
      workerRef.current.postMessage(songs);
    }
  }, [songs]);

  useEffect(() => {
    console.log('Processed Songs:', processedSongs);

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    console.log('Canvas and context are ready');
    if (canvas && context) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      context.clearRect(0, 0, canvas.width, canvas.height);

      const drawNode = (x: number, y: number, radius: number, color: string) => {
        console.log('Drawing node:', { x, y, radius, color });
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
        context.stroke();
      };

      const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        console.log('Drawing line:', { x1, y1, x2, y2 });
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      };

      const numContinents = 10;
      const continentWidth = canvas.width / numContinents;

      processedSongs.forEach((song, index) => {
        const continentIndex = Math.floor(index / (songs.length / numContinents));
        const x = continentIndex * continentWidth + Math.random() * continentWidth;
        const y = Math.random() * canvas.height;

        const radius = Math.sqrt(song.spotifyStreams) / 10;
        if (isNaN(radius)) {
          console.error('Invalid radius:', song.spotifyStreams);
        } else {
          drawNode(x, y, radius, 'blue');
        }

        song.similarities.forEach((similarity) => {
          const otherSong = songs.find((s) => s.isrc === similarity.isrc);
          if (otherSong) {
            const otherIndex = songs.indexOf(otherSong);
            const otherContinentIndex = Math.floor(otherIndex / (songs.length / numContinents));
            const otherX = otherContinentIndex * continentWidth + Math.random() * continentWidth;
            const otherY = Math.random() * canvas.height;
            drawLine(x, y, otherX, otherY);
          }
        });
      });
    }
  }, [processedSongs, songs]);

  return <canvas ref={canvasRef} />;
};
