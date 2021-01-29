import express from "express";
import cors from "cors";
import { MONGO_URI, PORT } from "./conf";
import { router } from "./router/router";
import mongoose from "mongoose";

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
});

(mongoose as any).Promise = global.Promise;
