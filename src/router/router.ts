import express from "express";
import Playlist, {
  PlaylistSchema,
} from "../initializations/mongo_models/Playlists";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { spotifyUpdateJob } from "../schedules/updateSpotifyPlaylists";
import {
  SpotifyPlaylistsId,
  SpotifyPlaylists,
} from "../initializations/spotify_api";

export const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const playlists = await Playlist.find({}).select("name").lean().exec();
    // creating playlists if they don't exists
    if (!playlists || playlists.length === 0) {
      const playlistsInfos: PlaylistSchema[] = [
        {
          lastUpdated: new Date(),
          name: SpotifyPlaylists.daily,
          spotifyId: SpotifyPlaylistsId.daily,
          tracks: [],
        },
        {
          lastUpdated: new Date(),
          name: SpotifyPlaylists.weekly,
          spotifyId: SpotifyPlaylistsId.weekly,
          tracks: [],
        },
        {
          lastUpdated: new Date(),
          name: SpotifyPlaylists.releases,
          spotifyId: SpotifyPlaylistsId.releases,
          tracks: [],
        },
      ];

      const playlistInstances = await Promise.all(
        playlistsInfos.map((playlistInfo) => Playlist.create(playlistInfo))
      );

      return res.json(
        playlistInstances.map(({ _id, name }) => ({ _id, name }))
      );
    }
    // its ok
    res.json(playlists);
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json({
      error: `Any playlist ${getReasonPhrase(StatusCodes.NOT_FOUND)}`,
    });
  }
});

router.get("/playlist/:id", async ({ params: { id } }, res) => {
  try {
    const playlist = await Playlist.findById(id).lean().exec();
    if (!playlist) {
      throw new Error(`Playlist not found in with following id of ${id}`);
    }
    const day = (() => {
      switch (playlist.name) {
        case SpotifyPlaylists.releases:
          return 2;
        case SpotifyPlaylistsId.weekly:
          return 7;
        default:
          return 1;
      }
    })();
    const providedTime = day * 24 * 60 * 60 * 1000;
    const isUpdatedOnedayAgo =
      Date.now() - new Date(playlist.lastUpdated).getTime() > providedTime;

    if (isUpdatedOnedayAgo || playlist.tracks.length === 0) {
      return res.json(
        await spotifyUpdateJob(playlist.spotifyId, playlist.name, playlist)
      );
    }
    res.json(playlist);
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json(error.message);
  }
});
