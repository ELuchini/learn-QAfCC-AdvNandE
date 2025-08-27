import { compareSync } from "bcrypt";
import passport from 'passport';
/* const { use, serializeUser, deserializeUser } = pkg; */
import LocalStrategy from "passport-local";
import { Strategy as GitHubStrategy } from "passport-github";
import pkgmongo from "mongodb";
const { ObjectID } = pkgmongo;

export default function (app, myDataBase) {
  /*  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`);
        if (err) return done(err);
        if (!user) return done(null, false);
        if (password !== user.password) return done(null, false);
        return done(null, user);
      });
    }),
  ); */

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://bc0febad-a10d-4a33-8ab2-89690f7ecf93-00-2g3np9a8t5613.spock.replit.dev/" /*INSERT CALLBACK URL ENTERED INTO GITHUB HERE*/,
      },
      function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        //Database logic here with callback containing your user object
        myDataBase.findOneAndUpdate(
          { id: profile.id },
          {
            $setOnInsert: {
              id: profile.id,
              username: profile.username,
              name: profile.displayName || "John Doe",
              photo: profile.photos[0].value || "",
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : "No public email",
              created_on: new Date(),
              provider: profile.provider || "",
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, doc) => {
            return cb(null, doc.value);
          },
        );
      },
    ),
  );

  passport.use(
    new LocalStrategy((username, password, done) => {
      console.log("[PASSPORT-LOCAL] Intentando autenticar:", username);
      myDataBase.findOne({ username: username }, (err, user) => {
        if (err) {
          console.error("[PASSPORT-LOCAL] Error en findOne:", err);
          return done(err);
        }
        if (!user) {
          console.warn("[PASSPORT-LOCAL] Usuario no encontrado:", username);
          return done(null, false);
        }
        console.log("[PASSPORT-LOCAL] Usuario encontrado:", user.username);
        const passwordMatch = compareSync(password, user.password);
        if (!passwordMatch) {
          console.warn("[PASSPORT-LOCAL] Contraseña incorrecta para:", username);
          return done(null, false);
        }
        console.log("[PASSPORT-LOCAL] Autenticación exitosa para:", username);
        return done(null, user);
      });
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
}
