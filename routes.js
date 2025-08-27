import { hashSync } from "bcrypt";

export default function (app, myDataBase, passport) {
  app.route("/").get((req, res) => {
    console.log("GET /");
    res.render("index", {
      title: "Connected to Database",
      message: "Please log in",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
      error: req.query.error || null,
    });
  });

  app
    .route("/login")
    .post(
      (req, res, next) => {
        console.log("POST /login", req.body);
        if (!req.body.username || !req.body.password) {
          console.error("[LOGIN] Faltan campos username o password");
        }
        next();
      },
      (req, res, next) => {
        console.log("[LOGIN] Antes de passport.authenticate");
        next();
      },
      passport.authenticate("local", {
        failureRedirect: "/?error=Usuario%20o%20contrase%C3%B1a%20incorrectos",
      }),
      (req, res) => {
        console.log("Login successful for user:", req.user && req.user.username);
        res.redirect("/profile");
      },
    );

  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render("profile", { username: req.user.username });
  });

  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.route("/register").post(
    (req, res, next) => {
      console.log("POST /register", req.body);
      if (!req.body.username || !req.body.password) {
        console.error("[REGISTER] Faltan campos username o password");
        return res.redirect("/?error=Faltan%20campos%20obligatorios");
      }
      const hash = hashSync(req.body.password, 12);
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          console.error("Error in findOne /register:", err);
          return res.redirect("/?error=Error%20de%20base%20de%20datos");
        } else if (user) {
          console.log("User already exists:", req.body.username);
          return res.redirect("/?error=El%20usuario%20ya%20existe");
        } else {
          myDataBase.insertOne(
            {
              username: req.body.username,
              password: hash,
            },
            (err, doc) => {
              if (err) {
                console.error("Error in insertOne /register:", err);
                return res.redirect("/?error=Error%20al%20registrar%20usuario");
              } else {
                console.log("User registered:", req.body.username);
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
              }
            },
          );
        }
      });
    },
    (req, res, next) => {
      console.log("[REGISTER] Antes de passport.authenticate");
      next();
    },
    passport.authenticate("local", {
      failureRedirect: "/?error=Error%20al%20autenticar%20despu%C3%A9s%20de%20registrar",
    }),
    (req, res, next) => {
      console.log("Registration and login successful for user:", req.user && req.user.username);
      res.redirect("/profile");
    },
  );

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });

  app.route("/auth/github").get(passport.authenticate("github"));
  app
    .route("/auth/github/callback")
    .get(
      passport.authenticate("github", { failureRedirect: "/" }),
      (req, res) => {
        req.session.user_id = req.user.id;
        res.redirect("/chat");
      },
    );

  /* app.route('/auth/github/callback')// Ejemplo de uso de passport. Se puede borrar.
  .get(passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {
    res.redirect('/profile');
  }) */
  app.route("/chat").get(ensureAuthenticated, (req, res) => {
    res.render("chat", { user: req.user });
  });
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
