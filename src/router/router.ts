import express from "express";
import Playlist from "../initializations/mongo_models/Playlists";
import passport from "../initializations/passport/passport";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import playTracks from "./routes/track:{id}-playTracks";

export const router = express.Router();

router.get("/", async (_, res) => {
  try {
    res.json(await Playlist.find({}).select("name").lean().exec());
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json({ error: `Any playlist ${getReasonPhrase(StatusCodes.NOT_FOUND)}` });
  }
});

router.get("/playlist/:id", async ({params: {id}}, res) => {
  try {
    const playlist = await Playlist.findById(id).lean().exec();
    if (!playlist) {
      throw new Error(`Playlist not found in with following id of ${id}`)
    }
    res.json(playlist);
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json(error.message)
  }
});

router.get("/playlist/:id/track/:tid", playTracks)

router.get("/auth/spotify/", passport.authenticate("spotify"));
router.get(
  "/auth/spotify/callback",
  passport.authenticate("spotify", {
    successRedirect: "/",
    failureMessage: "Failed to authenticate with spotify. Try again",
    failureFlash: true,
  })
);
