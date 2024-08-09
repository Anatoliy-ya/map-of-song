import { useEffect, useState } from 'react';
import './App.css';
import { Song } from './types/Song';
import { findSimilarSongs } from './utils/similarityCalculator';
import { SongListPage } from './pages/SongListPage';
import { SongMapPage } from './pages/SongMapPage';

import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store/store';
import { fetchAllSongs } from './store/songsSlice';

function App() {
  const [selectPage, setSelectPage] = useState<number>(0);
  const [similatitys, setSimilarities] = useState<Song[]>([]);
  const dispatch = useDispatch();
  const { songs, loading, error } = useSelector((state: RootState) => state.songs);

  useEffect(() => {
    dispatch(fetchAllSongs());
  }, [dispatch]);

  const handelSongSelect = (song: Song) => {
    setSimilarities(findSimilarSongs(song, songs));
  };
  if (loading) return <p>Loading...</p>;
  return (
    <Router>
      <div className="App">
        <nav>
          <ul className="pages-nav">
            <li
              className={selectPage === 0 ? 'songs-btn active-nav ' : 'songs-btn'}
              onClick={() => setSelectPage(0)}>
              <Link to="/">Songs</Link>
            </li>
            <li
              className={selectPage === 1 ? 'map-btn active-nav ' : 'map-btn'}
              onClick={() => setSelectPage(1)}>
              <Link to="/map">Map</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route
            path="/"
            element={
              <SongListPage
                songs={songs}
                onSongSelect={handelSongSelect}
                similarityList={similatitys}
              />
            }
          />
          <Route path="/map" element={<SongMapPage songs={songs} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
