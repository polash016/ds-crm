import fs from "fs";
import path from "path";

type ErrorEntry = Record<string, unknown>;

// Always write under project root 'logs/' by default (works in dev and Docker)
const LOG_DIR = process.env.LOG_FILE_DIR || path.join(process.cwd(), "logs");
const ERROR_LOG_FILE =
  process.env.LOG_ERROR_FILE || path.join(LOG_DIR, "error.log");
const SUCCESS_LOG_FILE =
  process.env.LOG_SUCCESS_FILE || path.join(LOG_DIR, "success.log");

function ensureLogDirExists(directoryPath: string) {
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  } catch {
    // swallow; file write will fail and be ignored below
  }
}

export function writeErrorLog(entry: ErrorEntry): void {
  try {
    ensureLogDirExists(LOG_DIR);
    const line = JSON.stringify({ time: new Date().toISOString(), ...entry });
    fs.appendFile(ERROR_LOG_FILE, line + "\n", (err) => {
      if (err) {
        // As a last resort, write to stderr. Avoid throwing to not break response.
        try {
          process.stderr.write(
            "[errorFileLogger] failed to append error.log: " +
              String(err) +
              "\n"
          );
        } catch {}
      }
    });
  } catch {
    // ignore any unexpected file system errors
  }
}

export function getErrorLogFilePath(): string {
  return ERROR_LOG_FILE;
}

export function writeSuccessLog(entry: Record<string, unknown>): void {
  try {
    ensureLogDirExists(LOG_DIR);
    const line = JSON.stringify({ time: new Date().toISOString(), ...entry });
    fs.appendFile(SUCCESS_LOG_FILE, line + "\n", () => {});
  } catch {
    // ignore
  }
}

export function getSuccessLogFilePath(): string {
  return SUCCESS_LOG_FILE;
}
