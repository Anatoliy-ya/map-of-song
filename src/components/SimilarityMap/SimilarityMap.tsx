import React, { useRef, useEffect, useState } from 'react';
import './SimilarityMap.css';
import { Song, Node, Link } from '../../types/types';
import { Modal } from '../../UI/Modal';

import rusMap from '../../assets/rus.svg';
import { RootState, AppDispatch } from '../../store/store';
import { useDispatch, useSelector } from 'react-redux';
import { fabric } from 'fabric';
import { setLinks, setNodes } from '../../store/songsSlice';

export const SimilarityMap: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();

  const processedSongs = useSelector((state: RootState) => state.songs.processedSongs);
  const nodes = useSelector((state: RootState) => state.songs.nodes);
  const links = useSelector((state: RootState) => state.songs.links);
  const { loading } = useSelector((state: RootState) => state.songs);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }[]>([]);
  const [similarities, setSimilarities] = useState<Song[]>([]);

  if (loading) {
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
          let isDragging = false;
          let lastX: number;
          let lastY: number;

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
              isDragging = true;
              fabricCanvas.selection = false;
              lastX = opt.e.clientX;
              lastY = opt.e.clientY;
            }
          });

          fabricCanvas.on('mouse:move', (opt) => {
            if (isDragging) {
              const e = opt.e;
              const vpt = fabricCanvas.viewportTransform!;
              vpt[4] += e.clientX - lastX;
              vpt[5] += e.clientY - lastY;
              lastX = e.clientX;
              lastY = e.clientY;

              requestAnimationFrame(() => {
                fabricCanvas.requestRenderAll();
              });
            }
          });

          fabricCanvas.on('mouse:up', () => {
            fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
            isDragging = false;
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
    if (processedSongs.length === 0 || coordinates.length === 0) {
      console.log('Processed Songs or Coordinates are missing');
      return;
    }

    const newNodes: Node[] = generateRandomPointsInsidePolygon(
      coordinates,
      processedSongs.length,
    ).map((coord, index) => ({
      x: coord.x,
      y: coord.y,
      song: processedSongs[index],
    }));

    dispatch(setNodes(newNodes));
  }, [processedSongs, coordinates, dispatch]);

  useEffect(() => {
    if (nodes.length === 0 || processedSongs.length === 0) {
      console.log('Nodes or Processed Songs are missing');
      return;
    }

    const newLinks: Link[] = [];
    processedSongs.forEach((song, i) => {
      song.similarities.forEach((similar) => {
        const targetIndex = processedSongs.findIndex((s) => s.id === similar.id);
        if (targetIndex !== -1) {
          newLinks.push({
            source: nodes[i],
            target: nodes[targetIndex],
            strength: similar.similarity,
          });
        }
      });
    });
    console.log('New Links:', newLinks);
    dispatch(setLinks(newLinks));
  }, [processedSongs, nodes]);

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

    // Добавляем подсказку
    fabricCanvasRef.current!.add(tooltip);

    // Удаляем подсказку при уходе с узла
    circle.on('mouseout', () => {
      fabricCanvasRef.current!.remove(tooltip);
    });

    // Удаляем подсказку при клике на холст
    fabricCanvasRef.current!.on('mouse:down', () => {
      fabricCanvasRef.current!.remove(tooltip);
    });
    fabricCanvasRef.current!.renderAll();
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
    console.log('Node:', node);

    // Удаление объектов типа 'circle' и 'line' с canvas
    fabricCanvasRef.current?.getObjects().forEach((obj) => {
      if (obj.type === 'circle' || obj.type === 'line') {
        fabricCanvasRef.current?.remove(obj);
      }
    });

    const selectedSong = processedSongs.find((song) => song.id === node.song.id);

    if (!selectedSong) {
      console.warn('@Selected song not found in processedSongs.');
      return;
    }

    const similaritySelectSongIds = selectedSong.similarities.map((similarity) => similarity.id);

    const similarSongs = processedSongs.filter((song) => similaritySelectSongIds.includes(song.id));
    console.log('@similarSongs', similarSongs);
    setSelectedNode(node);
    drawPoints(nodes);
    setSimilarities(similarSongs);
  };

  useEffect(() => {
    if (selectedNode) {
      drawLines(selectedNode, links);
    }
  }, [selectedNode, links]);

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
      {similarities && (
        <div className="similarity-list">
          {similarities.map((song) => (
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
