import passport from "passport";
import User from "../mongo_models/User";
import SpotifyStrategy from "./SpotifyStrategy";

passport.serializeUser((user, done)=>{
  done(null, (user as any).id);
})


passport.deserializeUser((id, done)=>{
    User.findById(id, 'username', {} ,(err, user)=>{
        if(err)done(err)
      done(null, user!);
    })
})

passport.use("spotify", SpotifyStrategy);

export default passport;