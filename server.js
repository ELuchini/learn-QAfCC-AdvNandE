"use strict";
import dotenv from "dotenv";
dotenv.config();
import express, { static as sta, json, urlencoded } from "express";
import myDB from "./connection.js";
import fccTesting from "./freeCodeCamp/fcctesting.js";
import session from "express-session";
import passport from "passport";
/* const { initialize, session: _session } = pkgpass; */

import routes from "./routes.js";
import auth from "./auth.js";

const app = express();

/* import dotenv from 'dotenv';
dotenv.config(); */

import { createServer } from "http";
import Server from "socket.io";


const http = createServer(app);
const io = new Server(http);

import { authorize } from "passport.socketio";
import cookieParser from "cookie-parser";

import MongoStore from "connect-mongo";
const URI = process.env.MONGO_URI;
const store = MongoStore.create({ mongoUrl: URI, });

app.set("view engine", "pug");
app.set("views", "./views/pug");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    key: "express.sid",
    store: store,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes

app.use("/public", sta(process.cwd() + "/public"));
app.use(json());
app.use(urlencoded({ extended: true }));

io.use(
  authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  }),
);

myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  routes(app, myDataBase);
  auth(app, myDataBase);

  let currentUsers = 0;
  io.on("connection", (socket) => {
    ++currentUsers;
    io.emit("user", {
      username: socket.request.user.username,
      currentUsers,
      connected: true,
    });
    console.log("A user has connected");
    socket.on("disconnect", () => {
      console.log("A user has disconnected");
      --currentUsers;
      io.emit("user count", currentUsers);
    });
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});

function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
