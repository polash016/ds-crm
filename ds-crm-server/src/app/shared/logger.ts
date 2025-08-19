import pino from "pino";
import config from "../config";

const isPretty = process.env.LOG_PRETTY === "1" || config.env === "development";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.token",
  "res.headers['set-cookie']",
];

const logger = pino({
  level:
    process.env.LOG_LEVEL || (config.env === "production" ? "info" : "debug"),
  name: process.env.SERVICE_NAME || "Sheba-Dashboard-Server",
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  messageKey: "msg",
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings(bindings) {
      return { pid: bindings.pid, hostname: bindings.hostname };
    },
  },
  transport: isPretty
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
          ignore: "pid,hostname",
        },
      }
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
          ignore: "pid,hostname",
        },
      },
});

export default logger;
