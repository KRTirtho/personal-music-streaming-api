import express from "express";
import cors from "cors";
import { MONGO_URI, PORT, SESSION_SECRET } from "./conf";
import { router } from "./router/router";
import mongoose from "mongoose";
import { updateSpotifyPlaylist } from "./schedules/updateSpotifyPlaylists";
import { SpotifyPlaylists, SpotifyPlaylistsId } from "./initializations/spotify_api";

const app = express();
// const MongoStore = connectMongo(session);
const dbConnection = mongoose.connection;

mongoose.connect(MONGO_URI as string, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err) console.log("Failed to connect:", err);
  return console.log("Connection Established to: ", MONGO_URI);
});

mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", router);

const port = PORT ?? 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // regular jobs to update the playlists
  updateSpotifyPlaylist("0 0 13 * * *", SpotifyPlaylistsId.daily, SpotifyPlaylists.daily); //everyday 1PM

  updateSpotifyPlaylist("0 0 14 */2 * *", SpotifyPlaylistsId.releases, SpotifyPlaylists.releases); //every two day 2PM

  updateSpotifyPlaylist("0 0 15 * * 7", SpotifyPlaylistsId.weekly, SpotifyPlaylists.weekly); // every sunday 3PM
});

(mongoose as any).Promise = global.Promise;
