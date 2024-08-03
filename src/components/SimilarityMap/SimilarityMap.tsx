import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Song } from '../../types/Song';
import similarityWorker from '../../workers/similarityWorker.ts?worker';
import backgroundMapSvg from '../../assets/1200px-Zlewiska-Zlewnie_Polski.svg';

interface SongWithSimilarities extends Song {
  similarSongs?: Array<{ isrc: string; similarity: number }>;
}

interface Node {
  x: number;
  y: number;
  song: Song;
}

interface Link {
  source: Node;
  target: Node;
  strength: number;
}

export const SimilarityMap: React.FC<{ songs: Song[] }> = ({ songs }) => {
  const [processedSongs, setProcessedSongs] = useState<SongWithSimilarities[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    workerRef.current = new similarityWorker();
    workerRef.current.onmessage = (event: MessageEvent<SongWithSimilarities[]>) => {
      setProcessedSongs(event.data);
    };

    // Загрузка фоновой карт
    const backgroundImage = new Image();
    backgroundImage.src = backgroundMapSvg;
    backgroundImage.onload = () => {
      backgroundImageRef.current = backgroundImage;
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (workerRef.current && songs.length > 0) {
      workerRef.current.postMessage(songs);
    }
  }, [songs]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // заполнение узлов и связей между песнями
    const newNodes = songs.map((song) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      song: song,
    }));

    const newLinks: Link[] = [];
    processedSongs.forEach((song, i) => {
      song.similarSongs?.forEach((similar) => {
        const targetIndex = songs.findIndex((s) => s.isrc === similar.isrc);
        if (targetIndex !== -1) {
          newLinks.push({
            source: newNodes[i],
            target: newNodes[targetIndex],
            strength: similar.similarity,
          });
        }
      });
    });

    setNodes(newNodes);
    setLinks(newLinks);

    const simulation = () => {
      // обновление координат узлов
      nodes.forEach((node) => {
        node.x += (Math.random() - 0.5) * 0.1;
        node.y += (Math.random() - 0.5) * 0.1;
      });
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background map
      if (backgroundImageRef.current) {
        ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
      }

      // Отрисовка связей
      if (selectedNode) {
        links.forEach((link) => {
          if (link.source === selectedNode || link.target === selectedNode) {
            ctx.beginPath();
            ctx.moveTo(link.source.x, link.source.y);
            ctx.lineTo(link.target.x, link.target.y);
            ctx.strokeStyle = `rgba(255, 0, 0, ${link.strength})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }

      // Отрисовка узлов
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = node === selectedNode ? 'red' : 'blue';
        ctx.fill();

        // Draw song title for selected node
        if (node === selectedNode) {
          ctx.font = '12px Arial';
          ctx.fillStyle = 'black';
          ctx.fillText(node.song.track, node.x + 10, node.y);
        }
      });
    };

    const animate = () => {
      simulation();
      render();
      requestAnimationFrame(animate);
    };

    animate();

    render();
  }, [songs, processedSongs, selectedNode]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      console.log('@handleCanvasClick');

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const clickedNode = nodes.find(
        (node) => Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2) < 5,
      );

      setSelectedNode(clickedNode || null);
    },
    [nodes],
  );

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={handleCanvasClick}
    />
  );
};
