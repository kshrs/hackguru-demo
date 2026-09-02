/**
 * Node.js API Gateway Server Entry Point
 * Listens on PORT 5000 (or process.env.PORT)
 */

const { createApp } = require("./app");

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`=======================================================`);
  console.log(`  HackGURU Node.js API Gateway running on port ${PORT}`);
  console.log(`  - Health:          GET  http://localhost:${PORT}/api/v1/health`);
  console.log(`  - Interactions:    POST http://localhost:${PORT}/api/v1/interactions`);
  console.log(`  - Recommendations: GET  http://localhost:${PORT}/api/v1/recommendations`);
  console.log(`=======================================================`);
});
