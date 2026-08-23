import dotenv from "dotenv";
import app from "./app.js";
import connect_db from "./db/db.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;

connect_db()
  .then(() => {
    app.listen(port, () => {
      console.log(`listening on localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error", error);
    process.exit(1);
  });
