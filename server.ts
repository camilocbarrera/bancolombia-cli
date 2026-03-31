import app from "./src/api/app";
import { API_PORT } from "./src/constants";

console.log(`Bancolombia API running on http://localhost:${API_PORT}`);

export default {
  port: API_PORT,
  fetch: app.fetch,
};
