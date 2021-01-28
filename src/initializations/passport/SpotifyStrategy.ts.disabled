import { Strategy } from "passport-spotify";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "../../conf";
import User from "../mongo_models/User";


const SpotifyStrategy = new Strategy(
  {
    clientID: SPOTIFY_CLIENT_ID as string,
    clientSecret: SPOTIFY_CLIENT_SECRET as string,
    callbackURL: "/auth/spotify/callback",
    scope: ["user-read-email"]
  },
  async (_, refreshToken, { displayName, _json:{email}, id: _id }, done) => {
    try {
      const user = await User.findOneAndUpdate({spotifyId: _id}, { username:displayName, email, spotifyId: _id, spotifyRefreshToken: refreshToken }, { upsert: true }).exec();
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
);

export default SpotifyStrategy;