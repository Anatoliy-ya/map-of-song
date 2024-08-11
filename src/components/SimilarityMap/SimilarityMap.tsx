import React, { useRef, useEffect, useState } from 'react';
import './SimilarityMap.css';
import { Song } from '../../types/Song';
import { Modal } from '../../UI/Modal';
import similarityWorker from '../../workers/similarityWorker.ts?worker';
import rusMap from '../../assets/rus.svg';
import otherMap from '../../assets/1200px-Zlewiska-Zlewnie_Polski.svg';
import otherMap2 from '../../assets/Czechian_EU_Election_2024_by_territory.svg.svg';
import { findSimilarSongs } from '../../utils/similarityCalculator';

import { fabric } from 'fabric';

interface SongWithSimilarities extends Song {
  similarities: Array<{ id: string; similarity: number }>;
  onSongSelect?: (song: Song) => void;
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
  const [similatitys, setSimilarities] = useState<Song[]>([]);

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
    if (workerRef.current && Array.isArray(songs) && songs.length > 0) {
      console.log('@songs', songs);
      workerRef.current.postMessage(songs);
    }
  }, [songs]);

  if (!Array.isArray(songs) || songs.length === 0) {
    return <div>Loading...</div>;
  }

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
            width: 1100,
            height: 800,
            backgroundColor: '#484848',
          });

          fabricCanvasRef.current = fabricCanvas;

          fabricCanvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = fabricCanvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 5) zoom = 5; // Ограничение максимального масштаба
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
            } else if (opt.e.altKey === false) {
              console.log('@mouse:down', opt.e.altKey);
            } else if (!opt.target) {
              console.log('@mouse:down', !opt.target);
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
      song.similarities.forEach((similar: { id: string; similarity: number }) => {
        const targetIndex = processedSongs.findIndex((s) => s.id === similar.id);
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

  const handleNodeMouseOver = (node: Node, circle: fabric.Circle) => {
    const tooltipText = `${node.song.artist} - ${node.song.track}`;

    // Создаем текстовую подсказку
    const tooltip = new fabric.Text(tooltipText, {
      left: node.x + 10,
      top: node.y - 10,
      fontSize: 14,
      fill: 'black',
      backgroundColor: 'white',
      selectable: false,
      hasControls: false,
      hasBorders: false,
    });

    // Добавляем подсказку на холст
    fabricCanvasRef.current!.add(tooltip);
    fabricCanvasRef.current!.renderAll();

    // Удаляем подсказку при уходе с узла
    circle.on('mouseout', () => {
      fabricCanvasRef.current!.remove(tooltip);
      fabricCanvasRef.current!.renderAll();
    });

    // Удаляем подсказку при клике на холст
    fabricCanvasRef.current!.on('mouse:down', () => {
      fabricCanvasRef.current!.remove(tooltip);
      fabricCanvasRef.current!.renderAll();
    });
  };

  const drawPoints = (nodes: Node[]) => {
    nodes.forEach((node) => {
      let radius: number;

      // Суммируем различные показатели для расчета популярности трека
      const streaming: number =
        node.song.spotifyStreams / 10_000_000 +
        node.song.youtubeViews / 10_000_000 +
        node.song.tiktokLikes / 100_000_000 +
        node.song.shazamCounts / 1_000_000;

      // Устанавливаем радиус в зависимости от суммарного значения
      if (streaming <= 30) {
        radius = 1;
      } else if (streaming <= 50) {
        radius = 1.2;
      } else if (streaming <= 70) {
        radius = 1.4;
      } else if (streaming <= 90) {
        radius = 1.6;
      } else if (streaming <= 110) {
        radius = 1.8;
      } else if (streaming <= 130) {
        radius = 2;
      } else if (streaming <= 150) {
        radius = 2.2;
      } else if (streaming <= 170) {
        radius = 2.4;
      } else if (streaming <= 190) {
        radius = 2.6;
      } else if (streaming <= 210) {
        radius = 2.8;
      } else {
        radius = 3;
      }

      // Создаем круг с рассчитанным радиусом
      const circle = new fabric.Circle({
        left: node.x,
        top: node.y,
        radius: radius,
        fill: '#912ecf',
        hasBorders: false,
        hasControls: false,
        selectable: false,
      });

      circle.on('mouseover', () => handleNodeMouseOver(node, circle));

      // Обработка кликов по кругу
      circle.on('mousedown', () => {
        handleNodeClick(node);
        setPositionModal({ x: node.x, y: node.y });
      });

      // Добавляем круг на холст
      fabricCanvasRef.current!.add(circle);
    });
  };

  const drawLines = (node: Node, links: Link[]) => {
    links.forEach((link) => {
      if (link.source.song.id === node.song.id || link.target.song.id === node.song.id) {
        const line = new fabric.Line([link.source.x, link.source.y, link.target.x, link.target.y], {
          stroke: 'red',
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvasRef.current!.add(line);
      }
    });

    fabricCanvasRef.current!.renderAll();
  };

  const handleNodeClick = (node: Node) => {
    console.log('Song:', node.song.track);

    fabricCanvasRef.current?.getObjects().forEach((obj) => {
      if (obj.type === 'circle' || obj.type === 'line') {
        fabricCanvasRef.current?.remove(obj);
      }
    });

    setSelectedNode(node);
    drawPoints(nodes);
    drawLines(node, links);
    setSimilarities(findSimilarSongs(node.song, songs));
  };

  const handleCanvasClick = (opt: fabric.IEvent<MouseEvent>) => {
    if (opt.e.altKey) {
      return;
    }

    fabricCanvasRef.current?.getObjects().forEach((obj) => {
      if (obj.type === 'circle' || obj.type === 'line') {
        fabricCanvasRef.current?.remove(obj);
      }
    });

    setSelectedNode(null);
    drawPoints(nodes);
  };

  useEffect(() => {
    if ((coordinates.length > 0, fabricCanvasRef.current)) {
      drawPoints(nodes);
      fabricCanvasRef.current.on('mouse:down', handleCanvasClick);
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
      {selectedNode && (
        <Modal>
          <span onClick={() => setSelectedNode(null)} className="close">
            X
          </span>
          <h3 className="text-song">Selected Song</h3>
          <p className="text-song">Track: {selectedNode.song.track}</p>
          <p className="text-song">Artist: {selectedNode.song.artist}</p>
          <p className="text-song">Album: {selectedNode.song.albumName}</p>
        </Modal>
      )}
      {similatitys && (
        <div className="similarity-list">
          {similatitys.map((song) => (
            <div
              key={song.id}
              className="song-item"
              onClick={() => handleNodeClick({ song, x: 0, y: 0 })}>
              <p>{song.artist}</p> - <p>{song.track}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
