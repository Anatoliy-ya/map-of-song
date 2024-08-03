import { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Song } from './types/Song';
import { useDispatch, useSelector } from 'react-redux';
import { loadSongs } from './data/loadSongs';
import { RootState } from './store/store';
import { calculateAllSimilarities, findSimilarSongs } from './utils/similarityCalculator';
import { SongListPage } from './pages/SongListPage';
import { SongMapPage } from './pages/SongMapPage';

function App() {
  const [selectPage, setSelectPage] = useState<number>(0);
  const dispatch = useDispatch();
  const songs = useSelector((state: RootState) => state.songs.songs);

  useEffect(() => {
    dispatch(loadSongs('/Songs2024mini.csv'));
  }, [dispatch]);

  const handelSongSelect = (targetSong: Song) => {
    findSimilarSongs(targetSong, songs);

    console.log('@targetSong', targetSong);
    console.log('@findSimilarSongs', findSimilarSongs(targetSong, songs));
  };

  return (
    <Router>
      <div className="App">
        <nav>
          <ul className="pages-nav">
            <li
              className={selectPage === 0 ? 'songs-btn active' : 'songs-btn'}
              onClick={() => setSelectPage(0)}>
              <Link to="/">Songs</Link>
            </li>
            <li
              className={selectPage === 1 ? 'map-btn active' : 'map-btn'}
              onClick={() => setSelectPage(1)}>
              <Link to="/map">Map</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route
            path="/"
            element={<SongListPage songs={songs} onSongSelect={handelSongSelect} />}
          />
          <Route path="/map" element={<SongMapPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
