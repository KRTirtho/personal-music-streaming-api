import express from "express";
import passport from "../initializations/passport/passport";

export const router = express.Router();

router.get("/", (_, res) => {
  res.json("HOME")
});
router.get("/auth/spotify/", passport.authenticate("spotify"))
router.get("/auth/spotify/callback", passport.authenticate("spotify", {
  successRedirect: "/", failureMessage: "Failed to authenticate with spotify. Try again", failureFlash: true}))