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

    // Загрузка фоновой карты
    const backgroundImage = new Image();
    backgroundImage.src = backgroundMapSvg;
    backgroundImage.onload = () => {
      backgroundImageRef.current = backgroundImage;
      renderMap();
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
    if (!canvasRef.current || !backgroundImageRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Функция проверки, находится ли точка внутри контура карты
    const isPointInMap = (x: number, y: number) => {
      const width = backgroundImageRef.current.width;
      const height = backgroundImageRef.current.height;

      // Использование Canvas для получения данных о пикселях карты
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const offscreenCtx = offscreenCanvas.getContext('2d');
      if (!offscreenCtx) return false;

      offscreenCtx.drawImage(backgroundImageRef.current, 0, 0);
      const pixel = offscreenCtx.getImageData(x, y, 1, 1).data;

      // Проверка, не является ли пиксель белым (цвет фона карты)
      return !(pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255 && pixel[3] === 255);
    };

    // Заполнение узлов и связей между песнями
    const newNodes: Node[] = [];
    const maxAttempts = 10000;
    let attempts = 0;

    while (newNodes.length < songs.length && attempts < maxAttempts) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      if (isPointInMap(x, y)) {
        newNodes.push({
          x,
          y,
          song: songs[newNodes.length],
        });
      }
      attempts++;
    }

    if (newNodes.length < songs.length) {
      console.error(
        `Failed to place all songs within the map. Placed ${newNodes.length} out of ${songs.length} songs.`,
      );
    }

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
  }, [songs, processedSongs]);

  const renderMap = () => {
    if (!canvasRef.current || !backgroundImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const simulation = () => {
      // Обновление координат узлов
      nodes.forEach((node) => {
        node.x += (Math.random() - 0.5) * 0.1;
        node.y += (Math.random() - 0.5) * 0.1;
      });
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Отрисовка фоновой карты
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

        // Отображение названия песни для выбранного узла
        if (node === selectedNode) {
          ctx.font = '12px Arial';
          ctx.fillStyle = 'red';
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
  };

  useEffect(() => {
    renderMap();
  }, [nodes, links, selectedNode]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

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
