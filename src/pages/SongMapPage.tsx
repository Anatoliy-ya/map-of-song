import React from 'react';
import './PageStyle.css';
import { SimilarityMap } from '../components/SimilarityMap/SimilarityMap';

export const SongMapPage: React.FC = () => {
  return (
    <div className="map-page">
      <SimilarityMap />
    </div>
  );
};
