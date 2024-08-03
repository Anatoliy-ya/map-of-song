import React from 'react';
import './PageStyle.css';

import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { SimilarityMap } from '../components/SimilarityMap/SimilarityMap';

export const SongMapPage: React.FC = () => {
  const songs = useSelector((state: RootState) => state.songs.songs);

  return (
    <div className="map-page">
      <h1>Map Page</h1>
      <SimilarityMap songs={songs} />
    </div>
  );
};
