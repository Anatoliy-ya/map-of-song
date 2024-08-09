import { useState } from 'react';
import './SongList.css';
import { Song } from '../../types/Song';

interface SongListProps {
  songs: Song[];
  onSongSelect?: (song: Song) => void;
}

export const SongList: React.FC<SongListProps> = ({ songs, onSongSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const songsPerPage = 10;

  const filteredSongs = songs.filter((song) => {
    const track = song.track;
    const artist = song.artist;

    return (
      typeof track === 'string' &&
      typeof artist === 'string' &&
      (track.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filteredSongs.length / songsPerPage);
  const currentSongs = filteredSongs.slice(
    (currentPage - 1) * songsPerPage,
    currentPage * songsPerPage,
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="song-list">
      <input
        type="text"
        placeholder="Search songs or artists..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <ul className="songs">
        {currentSongs.map((song) => (
          <li key={song.id} className="song-item" onClick={() => onSongSelect?.(song)}>
            <div className="song-album">
              <p>{song.albumName}</p>
            </div>
            <div className="song-info">
              <h3 className="song-title">{song.track}</h3>
              <p className="song-artist">{song.artist}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}>
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};
