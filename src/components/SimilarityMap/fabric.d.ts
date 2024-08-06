import { Canvas as FabricCanvas } from 'fabric/fabric-impl';

declare module 'fabric/fabric-impl' {
  interface Canvas extends FabricCanvas {
    lastPosX?: number;
    lastPosY?: number;
    isDragging?: boolean;
  }
}
