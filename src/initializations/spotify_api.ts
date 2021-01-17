import SpotifyWebAPI from "spotify-web-api-node";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "../conf";

export const spotifyAPI = new SpotifyWebAPI({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: "/auth/spotify/callback",
});

export enum SpotifyPlaylistsId {
  daily = "37i9dQZF1DXcBWIGoYBM5M",
  weekly = "37i9dQZF1DX2L0iB23Enbq",
  releases = "37i9dQZF1DWUa8ZRTfalHk",
}

export enum SpotifyPlaylists {
  daily = "daily",
  weekly = "weekly",
  releases = "releases",
}
