import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { verifyMailer } from "./src/config/mailer.js";

import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  await verifyMailer();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
