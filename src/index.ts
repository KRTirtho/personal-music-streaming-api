import express from "express";
import cors from "cors";
import { MONGO_URI, PORT, SESSION_SECRET } from "./conf";
import { router } from "./router/router";
import mongoose from "mongoose";
import passport from "passport";
import connectMongo from "connect-mongo";
import session from "express-session";
import { updateSpotifyPlaylist } from "./schedules/updateSpotifyPlaylists";
import { SpotifyPlaylists, SpotifyPlaylistsId } from "./initializations/spotify_api";

const app = express();
const MongoStore = connectMongo(session);
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
app.use(
  session({
    secret: SESSION_SECRET as string,
    store: new MongoStore({ mongooseConnection: dbConnection }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 60 * 60 * 60,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", router);

const port = PORT ?? 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // regular jobs to update the playlists
  updateSpotifyPlaylist("0 0 1 * * *", SpotifyPlaylistsId.daily, SpotifyPlaylists.daily); //everyday 1PM

  updateSpotifyPlaylist("0 2 */2 * *", SpotifyPlaylistsId.releases, SpotifyPlaylists.releases); //every two day 2PM

  updateSpotifyPlaylist("0 3 * * 7", SpotifyPlaylistsId.weekly, SpotifyPlaylists.weekly); // every sunday 3PM
});

(mongoose as any).Promise = global.Promise;
