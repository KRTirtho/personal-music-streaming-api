import cron from "node-cron";
import { youtubeScrapSearch } from "../initializations/youtube_api";
import { spotifyAPI, SpotifyPlaylists, SpotifyPlaylistsId } from "../initializations/spotify_api";
import Playlist, { PlaylistTrack } from "../initializations/mongo_models/Playlists";
import fs from "fs";
import path from "path";

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

async function ytTrackSearch(item: SpotifyApi.PlaylistTrackObject, index: number, tracksLength: number): Promise<PlaylistTrack | undefined> {
  try {
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
    if (ytQResults) {
      const matchedRes = ytQResults.filter((qRes) => {
        // temporarily using this later will be replaced
        if (qRes.channel.name.includes(item.track.artists[0].name) && includesMultiple(qRes.title!, [item.track.name, ...item.track.artists.map((v) => v.name)])) {
          return true;
        }
        return false;
      });

      if (matchedRes.length > 0) {
        console.log("Total matched query result is", matchedRes.length, "in track no.", index, "total of", tracksLength, "tracks");
        // returning the properties for the perfect matches
        return {
          name: item.track.name,
          artists: artists,
          url: `https://youtube.com/watch?v=${matchedRes[0].id}`,
        };
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function spotifyCronJob(playlistId: SpotifyPlaylistsId, playlistName: SpotifyPlaylists) {
  console.log(
    `------------------------------------------------------\nCron Job of ${playlistName}\nDate: ${new Date().toUTCString()}\n------------------------------------------------------
    `
  );
  try {
    const {
      body: { access_token },
    } = await spotifyAPI.clientCredentialsGrant();
    spotifyAPI.setAccessToken(access_token);

    const { tracks } = (await spotifyAPI.getPlaylist(playlistId)).body;
    console.log("Got new tracks in", playlistName, "total of", tracks.items.length);

    const isLongList = tracks.items.length > 25;
    const isTooLongList = tracks.items.length > 60;
    const availableTracks = [
      ...(await Promise.all(tracks.items.slice(1, isLongList ? 25 : tracks.items.length).map((x, i) => ytTrackSearch(x, i, tracks.items.length)))),
      ...(isLongList ? await Promise.all(tracks.items.slice(26, isTooLongList ? 60 : tracks.items.length).map((x, i) => ytTrackSearch(x, i, tracks.items.length))) : []),
      ...(isTooLongList ? await Promise.all(tracks.items.slice(61, tracks.items.length).map((x, i) => ytTrackSearch(x, i, tracks.items.length))) : []),
    ].filter(Boolean) as PlaylistTrack[];

    console.log("Total availableTracks", availableTracks.length, "of", tracks.items.length);

    const playlist = await Playlist.findOne({ name: playlistName }).exec();

    if (!playlist) {
      const newPlaylist = await Playlist.create({ name: playlistName, tracks: availableTracks });
      console.log("Created new Playlist with", newPlaylist.tracks.length, "tracks");
    } else {
      const playlistTracks: PlaylistTrack[] = playlist.tracks;
      const availableUniqueTracks = availableTracks.filter((avTrack) => {
        return !playlistTracks.some((track) => avTrack.name === track.name);
      });
      console.log("Filtered available #Unique tracks", availableUniqueTracks.length, "of total availableTracks", availableTracks.length);
      await Playlist.updateOne({ name: playlistName }, { tracks: [...availableUniqueTracks, ...playlistTracks], name: playlistName }, { new: true });
      console.log("Updated Playlist total of", 1);
    }
  } catch (err) {
    console.error(err);
  } finally {
    console.log("Finished Cron Job of", playlistName, "in", new Date().toUTCString());
  }
}