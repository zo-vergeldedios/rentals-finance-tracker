import { PGlite } from "@electric-sql/pglite";
import { createServer } from "pglite-server";

const port = Number(process.env.PGLITE_PORT || 54321);
const db = new PGlite();
await db.waitReady;

const pgServer = createServer(db);
pgServer.listen(port, () => {
  console.log(`PGlite server listening on ${port}`);
  console.log(`DATABASE_URL=postgres://postgres@localhost:${port}`);
});
