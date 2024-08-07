import React, { useRef, useEffect, useState, useCallback } from 'react';
import './SimilarityMap.css';
import { fabric } from 'fabric';
import { Song } from '../../types/Song';
import similarityWorker from '../../workers/similarityWorker.ts?worker';
import { Modal } from '../../UI/Modal';
import rusMap from '../../assets/rus.svg';

interface SongWithSimilarities extends Song {
  similarities: Array<{ isrc: string; similarity: number }>;
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
  const [positionModal, setPositionModal] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    workerRef.current = new similarityWorker();
    workerRef.current.onmessage = (event: MessageEvent<SongWithSimilarities[]>) => {
      console.log('@worker', event.data);
      setProcessedSongs(event.data);
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
    const loadSvgMap = async () => {
      try {
        const response = await fetch(rusMap);
        const svgText = await response.text();

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const paths = svgDoc.querySelectorAll('path');

        if (paths.length > 0) {
          const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: 1200,
            height: 800,
          });

          fabricCanvasRef.current = fabricCanvas;

          fabricCanvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = fabricCanvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 2) zoom = 2; // Ограничение максимального масштаба
            if (zoom < 0.1) zoom = 0.1; // Ограничение минимального масштаба
            fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
          });

          fabricCanvas.on('mouse:down', (opt) => {
            if (opt.e.altKey === true) {
              fabricCanvas.isDragging = true;
              fabricCanvas.selection = false;
              fabricCanvas.lastPosX = opt.e.clientX;
              fabricCanvas.lastPosY = opt.e.clientY;
            } else if (!opt.target) {
              console.log('@mouse:down', !opt.target);
              setSelectedNode(null);
            }
          });

          fabricCanvas.on('mouse:move', (opt) => {
            if (fabricCanvas.isDragging) {
              const e = opt.e;
              const vpt = fabricCanvas.viewportTransform!;
              vpt[4] += e.clientX - fabricCanvas.lastPosX!;
              vpt[5] += e.clientY - fabricCanvas.lastPosY!;
              fabricCanvas.requestRenderAll();
              fabricCanvas.lastPosX = e.clientX;
              fabricCanvas.lastPosY = e.clientY;
            }
          });

          fabricCanvas.on('mouse:up', () => {
            fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
            fabricCanvas.isDragging = false;
            fabricCanvas.selection = true;
          });

          let allCoordinates: { x: number; y: number }[] = [];

          paths.forEach((path) => {
            const pathLength = path.getTotalLength();
            const pathCoordinates = [];

            for (let i = 0; i < pathLength; i += 10) {
              const point = path.getPointAtLength(i);
              pathCoordinates.push({ x: point.x, y: point.y });
            }

            allCoordinates = allCoordinates.concat(pathCoordinates);

            const fabricPath = new fabric.Path(path.getAttribute('d')?.toString(), {
              fill: 'none',
              stroke: 'blue',
              strokeWidth: 1,
              selectable: false,
            });

            fabricCanvas.add(fabricPath);
          });

          setCoordinates(allCoordinates);

          fabricCanvas.renderAll();
        } else {
          console.error('No path elements found in SVG.');
        }
      } catch (error) {
        console.error('Error loading SVG:', error);
      }
    };

    loadSvgMap();
  }, []);

  useEffect(() => {
    if (processedSongs.length === 0 || coordinates.length === 0) return;

    const newNodes: Node[] = generateRandomPointsInsidePolygon(
      coordinates,
      processedSongs.length,
    ).map((coord, index) => ({
      x: coord.x,
      y: coord.y,
      song: processedSongs[index],
    }));

    setNodes(newNodes);

    const newLinks: Link[] = [];
    processedSongs.forEach((song, i) => {
      song.similarities.forEach((similar: { isrc: string; similarity: number }) => {
        const targetIndex = processedSongs.findIndex((s) => s.isrc === similar.isrc);
        if (targetIndex !== -1) {
          newLinks.push({
            source: newNodes[i],
            target: newNodes[targetIndex],
            strength: similar.similarity,
          });
        }
      });
    });

    setLinks(newLinks);
    console.log('@newLinks', newLinks);
    console.log('@newNodes', newNodes);

    return () => {
      fabricCanvasRef.current?.dispose();
    };
  }, [processedSongs, coordinates]);

  useEffect(() => {
    if ((coordinates.length > 0, fabricCanvasRef.current)) {
      nodes.forEach((node) => {
        let radius: number;
        const streaming: number =
          node.song.pandoraStreams +
          node.song.appleMusicPlaylistCount +
          node.song.spotifyPlaylistCount +
          node.song.shazamCounts / 4;
        if (streaming <= 300) {
          radius = 2;
        } else if (streaming <= 400) {
          radius = 2.2;
        } else if (streaming <= 500) {
          radius = 2.4;
        } else if (streaming <= 600) {
          radius = 2.6;
        } else if (streaming <= 700) {
          radius = 2.8;
        } else if (streaming <= 800) {
          radius = 3;
        } else if (streaming <= 900) {
          radius = 3.3;
        } else if (streaming <= 1000) {
          radius = 3.6;
        } else {
          radius = 4;
        }
        console.log('@radius', radius);
        const circle = new fabric.Circle({
          left: node.x,
          top: node.y,
          radius: radius,
          fill: 'blue',
          selectable: false,
        });

        fabricCanvasRef.current!.add(circle);
      });

      fabricCanvasRef.current.renderAll();
    }
  }, [coordinates, nodes]);

  const generateRandomPointsInsidePolygon = (
    polygon: { x: number; y: number }[],
    count: number,
  ) => {
    const points = [];

    const minX = Math.min(...polygon.map((point) => point.x));
    const maxX = Math.max(...polygon.map((point) => point.x));
    const minY = Math.min(...polygon.map((point) => point.y));
    const maxY = Math.max(...polygon.map((point) => point.y));

    while (points.length < count) {
      const x = Math.random() * (maxX - minX) + minX;
      const y = Math.random() * (maxY - minY) + minY;

      if (isPointInsidePolygon({ x, y }, polygon)) {
        points.push({ x, y });
      }
    }

    return points;
  };

  const isPointInsidePolygon = (
    point: { x: number; y: number },
    polygon: { x: number; y: number }[],
  ) => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) isInside = !isInside;
    }
    return isInside;
  };

  return (
    <div className="similarity-map">
      <canvas ref={canvasRef} className="canvas" />
    </div>
  );
};
