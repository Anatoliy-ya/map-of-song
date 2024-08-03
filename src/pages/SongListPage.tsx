import React from 'react';
import './PageStyle.css';
import { Song } from '../types/Song';
import { SongList } from '../components/SongList/SongList';

interface SongListPageProps {
  songs: Song[];
  onSongSelect?: (song: Song) => void;
}

export const SongListPage: React.FC<SongListPageProps> = ({ songs, onSongSelect }) => {
  return (
    <div className="song-list-page">
      <h1>Song List</h1>
      <SongList songs={songs} onSongSelect={onSongSelect} />
    </div>
  );
};
