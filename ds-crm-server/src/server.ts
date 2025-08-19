import { Server } from "http";
import config from "./app/config";
import app from "./app";
import logger from "./app/shared/logger";

async function main() {
  const server: Server = app.listen(config.port, () => {
    logger.info({ port: config.port }, "Server is running");
    // Clean console output for terminal
    console.log(`✅ DS CRM Server is running on port ${config.port}`);
    console.log(`📊 View logs at: http://localhost:${config.port}/logs`);
    console.log(`🚀 API available at: http://localhost:${config.port}/api/v1`);
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        logger.info("Server closed!");
      });
    }
    process.exit(1);
  };
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Uncaught exception");
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    logger.fatal({ err: error }, "Unhandled rejection");
    exitHandler();
  });
}

main();
