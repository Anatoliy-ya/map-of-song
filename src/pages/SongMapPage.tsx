import React from 'react';
import './PageStyle.css';
import { SimilarityMap } from '../components/SimilarityMap/SimilarityMap';
import { Song } from '../types/types';

interface SongMapPageProps {
  songs: Song[];
}
export const SongMapPage: React.FC<SongMapPageProps> = ({ songs }) => {
  return (
    <div className="map-page">
      <SimilarityMap songs={songs} />
    </div>
  );
};
