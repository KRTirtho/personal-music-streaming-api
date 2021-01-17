import cron from "node-cron";
import { youtubeApiSearch, youtubeScrapSearch } from "../initializations/youtube_api";
import { spotifyAPI, SpotifyPlaylists, SpotifyPlaylistsId } from "../initializations/spotify_api";
import Playlist, { PlaylistTrack } from "../initializations/mongo_models/Playlists";
import fs from "fs";
import path from "path";
import { YOUTUBE_DATA_API_KEY } from "../conf";

function includesMultiple(src: string, arr: string[], matchAll: boolean = true) {
  const testExp = (val: string) => src.includes(val);
  if (matchAll) arr.every(testExp);
  return arr.some(testExp);
}

/**
 * Writes any object|string|number|boolean as string to a file in with its file name
 * @author KR Tirtho
 * @param {string} filename name of the file
 * @param {*} data data to write to the file
 */
function writeLogFile(filename: string, data: any, { rmBeforeNew }: { rmBeforeNew?: boolean } = {}): void {
  const filepath = path.join(process.cwd(), "log", filename);
  if (rmBeforeNew && fs.existsSync(filename)) {
    fs.rmSync(filename);
  }
  fs.appendFileSync(filepath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
}

export function updateSpotifyPlaylist(time: string, playlistId: SpotifyPlaylistsId, playlistName: SpotifyPlaylists) {
  // to avoid updating the three playlist at same day
  if (new Date().getDay() === 0 && playlistId !== SpotifyPlaylistsId.weekly && playlistName !== SpotifyPlaylists.weekly) {
    return;
  }
  cron.schedule(time, () => spotifyCronJob(playlistId, playlistName));
}

async function spotifyCronJob(playlistId: SpotifyPlaylistsId, playlistName: SpotifyPlaylists) {
  try {
    const {
      body: { access_token },
    } = await spotifyAPI.clientCredentialsGrant();
    spotifyAPI.setAccessToken(access_token);

    const { tracks } = (await spotifyAPI.getPlaylist(playlistId)).body;
    // writing log file for spotify playlist tracks
    writeLogFile("spotify-playlist-track.log", tracks, { rmBeforeNew: true });
    const availableTracks = (
      await Promise.all(
        tracks.items.slice(1, 10).map(
          async (item): Promise<PlaylistTrack | undefined> => {
            // getting the artists formatted for query
            const artists = item.track.artists
              .map((artist, index) => {
                if (index === 0) {
                  return `${artist.name} `;
                } else if (index === 1) {
                  return `feat. ${artist.name}`;
                }
                return `, ${artist.name}`;
              })
              .join("");
            // querying for matching data
            const ytQResults = await youtubeScrapSearch(`${artists} ${item.track.name} official video`);
            // writing yt query result logs
            writeLogFile("yt-query-results.log", ytQResults);
            if (ytQResults) {
              const matchedRes = ytQResults.filter((qRes) => {
                // temporarily using this later will be replaced
                if (qRes.channel.name.includes(item.track.artists[0].name) && includesMultiple(qRes.title!, [item.track.name, ...item.track.artists.map((v) => v.name)])) {
                  return true;
                }
                return false;
              });

              if (matchedRes.length > 0) {
                // returning the properties for the perfect matches
                return {
                  name: item.track.name,
                  artists: artists,
                  url: `https://youtube.com/watch?v=${matchedRes[0].id}`,
                };
              }
            }
          }
        )
      )
    ).filter(Boolean);
    const playlist = await Playlist.findOne({ name: playlistName }).exec();
    if (!playlist || playlist.length === 0) {
      const newPlaylist = await Playlist.create({ name: playlistName, tracks: availableTracks });
      console.log('newPlaylist:', newPlaylist)
    } else {
      const updatedPlaylist = await Playlist.findOneAndUpdate({ name: playlistName }, { $addToSet: { "tracks.$": availableTracks }, name: playlistName }, { new: true });
    console.log("updatedPlaylist:", updatedPlaylist);
    }

  } catch (err) {
    console.error(err);
  }
}

spotifyCronJob(SpotifyPlaylistsId.daily, SpotifyPlaylists.daily);
