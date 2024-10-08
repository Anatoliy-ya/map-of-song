import { Song } from '../types/types';

export const csvHeaders = [
  'Track',
  'Album Name',
  'Artist',
  'Release Date',
  'ISRC',
  'All Time Rank',
  'Track Score',
  'Spotify Streams',
  'Spotify Playlist Count',
  'Spotify Playlist Reach',
  'Spotify Popularity',
  'YouTube Views',
  'YouTube Likes',
  'TikTok Posts',
  'TikTok Likes',
  'TikTok Views',
  'YouTube Playlist Reach',
  'Apple Music Playlist Count',
  'AirPlay Spins',
  'SiriusXM Spins',
  'Deezer Playlist Count',
  'Deezer Playlist Reach',
  'Amazon Playlist Count',
  'Pandora Streams',
  'Pandora Track Stations',
  'Soundcloud Streams',
  'Shazam Counts',
  'TIDAL Popularity',
  'Explicit Track',
];

export const mapHeaderToKey: { [key: string]: keyof Song } = {
  id: 'id',
  Track: 'track',
  'Album Name': 'albumName',
  Artist: 'artist',
  'Release Date': 'releaseDate',
  ISRC: 'isrc',
  'All Time Rank': 'allTimeRank',
  'Track Score': 'trackScore',
  'Spotify Streams': 'spotifyStreams',
  'Spotify Playlist Count': 'spotifyPlaylistCount',
  'Spotify Playlist Reach': 'spotifyPlaylistReach',
  'Spotify Popularity': 'spotifyPopularity',
  'YouTube Views': 'youtubeViews',
  'YouTube Likes': 'youtubeLikes',
  'TikTok Posts': 'tiktokPosts',
  'TikTok Likes': 'tiktokLikes',
  'TikTok Views': 'tiktokViews',
  'YouTube Playlist Reach': 'youtubePlaylistReach',
  'Apple Music Playlist Count': 'appleMusicPlaylistCount',
  'AirPlay Spins': 'airplaySpins',
  'SiriusXM Spins': 'siriusXMSpins',
  'Deezer Playlist Count': 'deezerPlaylistCount',
  'Deezer Playlist Reach': 'deezerPlaylistReach',
  'Amazon Playlist Count': 'amazonPlaylistCount',
  'Pandora Streams': 'pandoraStreams',
  'Pandora Track Stations': 'pandoraTrackStations',
  'Soundcloud Streams': 'soundcloudStreams',
  'Shazam Counts': 'shazamCounts',
  'TIDAL Popularity': 'tidalPopularity',
  'Explicit Track': 'isExplicit',
};

export const features: (keyof Song)[] = [
  'allTimeRank',
  'trackScore',
  'spotifyStreams',
  'spotifyPlaylistCount',
  'spotifyPlaylistReach',
  'spotifyPopularity',
  'youtubeViews',
  'youtubeLikes',
  'tiktokPosts',
  'tiktokLikes',
  'tiktokViews',
  'youtubePlaylistReach',
  'appleMusicPlaylistCount',
  'airplaySpins',
  'siriusXMSpins',
  'deezerPlaylistCount',
  'deezerPlaylistReach',
  'amazonPlaylistCount',
  'pandoraStreams',
  'pandoraTrackStations',
  'soundcloudStreams',
  'shazamCounts',
  'tidalPopularity',
];
