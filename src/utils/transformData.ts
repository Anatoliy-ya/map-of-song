import { Song } from '../types/types';

export function transformData(rawData: any): Song {
  return {
    id: rawData.id,
    track: rawData.Track,
    albumName: rawData['Album Name'],
    artist: rawData.Artist,
    releaseDate: rawData['Release Date'],
    isrc: rawData.ISRC,
    allTimeRank: parseInt(rawData['All Time Rank'], 10) || 0,
    trackScore: parseFloat(rawData['Track Score']) || 0,
    spotifyStreams: parseInt(rawData['Spotify Streams'].replace(/,/g, ''), 10) || 0,
    spotifyPlaylistCount: parseInt(rawData['Spotify Playlist Count'].replace(/,/g, ''), 10) || 0,
    spotifyPlaylistReach: parseInt(rawData['Spotify Playlist Reach'].replace(/,/g, ''), 10) || 0,
    spotifyPopularity: parseInt(rawData['Spotify Popularity'], 10) || 0,
    youtubeViews: parseInt(rawData['YouTube Views'].replace(/,/g, ''), 10) || 0,
    youtubeLikes: parseInt(rawData['YouTube Likes'].replace(/,/g, ''), 10) || 0,
    tiktokPosts: parseInt(rawData['TikTok Posts'].replace(/,/g, ''), 10) || 0,
    tiktokLikes: parseInt(rawData['TikTok Likes'].replace(/,/g, ''), 10) || 0,
    tiktokViews: parseInt(rawData['TikTok Views'].replace(/,/g, ''), 10) || 0,
    youtubePlaylistReach: parseInt(rawData['YouTube Playlist Reach'].replace(/,/g, ''), 10) || 0,
    appleMusicPlaylistCount:
      parseInt(rawData['Apple Music Playlist Count'].replace(/,/g, ''), 10) || 0,
    airplaySpins: parseInt(rawData['AirPlay Spins'].replace(/,/g, ''), 10) || 0,
    siriusXMSpins: parseInt(rawData['SiriusXM Spins'].replace(/,/g, ''), 10) || 0,
    deezerPlaylistCount: parseInt(rawData['Deezer Playlist Count'].replace(/,/g, ''), 10) || 0,
    deezerPlaylistReach: parseInt(rawData['Deezer Playlist Reach'].replace(/,/g, ''), 10) || 0,
    amazonPlaylistCount: parseInt(rawData['Amazon Playlist Count'].replace(/,/g, ''), 10) || 0,
    pandoraStreams: parseInt(rawData['Pandora Streams'].replace(/,/g, ''), 10) || 0,
    pandoraTrackStations: parseInt(rawData['Pandora Track Stations'].replace(/,/g, ''), 10) || 0,
    soundcloudStreams: parseInt(rawData['Soundcloud Streams'].replace(/,/g, ''), 10) || 0,
    shazamCounts: parseInt(rawData['Shazam Counts'].replace(/,/g, ''), 10) || 0,
    tidalPopularity: parseInt(rawData['TIDAL Popularity'], 10) || 0,
    isExplicit: rawData['Explicit Track'] === '1',
  };
}
