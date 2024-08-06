import React, { useRef, useEffect, useState } from 'react';
import './SimilarityMap.css';
import { fabric } from 'fabric';
import { Song } from '../../types/Song';
import similarityWorker from '../../workers/similarityWorker.ts?worker';
import { Modal } from '../../UI/Modal';

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

  useEffect(() => {
    workerRef.current = new similarityWorker();
    workerRef.current.onmessage = (event: MessageEvent<SongWithSimilarities[]>) => {
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
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
    });

    fabricCanvas.setZoom(2);

    fabricCanvasRef.current = fabricCanvas;

    fabricCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
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

    const newNodes: Node[] = [];
    const maxAttempts = 1000;
    let attempts = 0;

    while (newNodes.length < songs.length && attempts < maxAttempts) {
      const x = Math.random() * fabricCanvas.getWidth();
      const y = Math.random() * fabricCanvas.getHeight();

      newNodes.push({
        x,
        y,
        song: songs[newNodes.length],
      });

      attempts++;
    }

    setNodes(newNodes);
    console.log('@processedSongs', processedSongs);
    const newLinks: Link[] = [];
    processedSongs.forEach((song, i) => {
      song.similarities.forEach((similar: { isrc: string; similarity: number }) => {
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

    setLinks(newLinks);
    console.log('@newLinks', newLinks);
    console.log('@newNodes', newNodes);

    return () => {
      fabricCanvas.dispose();
    };
  }, [songs, processedSongs]);

  const updateCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();

      nodes.forEach((node) => {
        const circle = new fabric.Circle({
          left: node.x,
          top: node.y,
          radius: 5,
          fill: selectedNode && selectedNode.song.isrc === node.song.isrc ? 'red' : 'blue',
          hasBorders: false,
          hasControls: false,
          selectable: false,
        });

        circle.on('mousedown', (e) => {
          console.log('@mousedown', e.target);
          setSelectedNode(node);
          setPositionModal({ x: e.pointer!.x, y: e.pointer!.y });
        });

        fabricCanvasRef.current?.on('mouse:down', (options) => {
          console.log('@mouse:down', options.target);
          if (options.target) return;
          setSelectedNode(null);
        });

        fabricCanvasRef.current?.add(circle);
      });

      if (selectedNode) {
        console.log('links', links);
        links.forEach((link) => {
          if (link.source === selectedNode || link.target === selectedNode) {
            const line = new fabric.Line(
              [link.source.x, link.source.y, link.target.x, link.target.y],
              {
                stroke: 'red',
                strokeWidth: link.strength * 2,
                selectable: false,
              },
            );
            fabricCanvasRef.current?.add(line);
          }
        });
      }

      fabricCanvasRef.current.renderAll();
    }
  };

  useEffect(() => {
    updateCanvas();
  }, [nodes, links, selectedNode]);

  return (
    <div className="similarity-map">
      <canvas ref={canvasRef} className="canvas" />
      {selectedNode && positionModal && (
        <Modal
          showModal={selectedNode !== null}
          style={{
            position: 'absolute',
            left: positionModal.x,
            top: positionModal.y,
          }}>
          <h3 style={{ borderBottom: '1px solid black' }}>Selected Song</h3>
          <p style={{ borderBottom: '1px solid black' }}>Title: {selectedNode.song.track}</p>
          <p style={{ borderBottom: '1px solid black' }}>Artist: {selectedNode.song.artist}</p>
        </Modal>
      )}
    </div>
  );
};
