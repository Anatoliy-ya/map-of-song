import React from 'react';
import './PageStyle.css';
import { SimilarityMap } from '../components/SimilarityMap/SimilarityMap';
import { Song } from '../types/types';

export const SongMapPage: React.FC = () => {
  return (
    <div className="map-page">
      <SimilarityMap />
    </div>
  );
};
