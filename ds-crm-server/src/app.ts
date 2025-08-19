import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import httpStatus from "http-status";
import cookieParser from "cookie-parser";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import pinoHttp from "pino-http";
import logger from "./app/shared/logger";
import crypto from "crypto";
import { writeSuccessLog } from "./app/shared/errorFileLogger";

const app: Application = express();
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const allowedOrigins = [
//   // "https://event-hive-client.vercel.app",
//   "http://localhost:3000",
//   "http://localhost:3001", // Include localhost for development
// ];

// const corsOptions = {
//   origin: function (origin: any, callback: any) {
//     if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps)

//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));

// HTTP logger with request-id and redaction
app.use(
  pinoHttp({
    logger,
    genReqId: (req:Request, res:Response) => {
      const existing = req.headers["x-request-id"] as string | undefined;
      const id = existing || crypto.randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    customProps: (req:Request) => ({
      service: process.env.SERVICE_NAME || "Sheba-Dashboard-Server",
      env: process.env.NODE_ENV,
      userId: (req as any).user?.id,
    }),
    serializers: {
      req(request) {
        return { id: request.id, method: request.method, url: request.url };
      },
      res(response) {
        return { statusCode: response.statusCode };
      },
    },
    quietReqLogger: true,
  })
);

// Success log writer (2xx/3xx) to file under ./logs/success.log
app.use((req: Request, res: Response, next: NextFunction) => {
  const startHr = process.hrtime.bigint();
  res.on("finish", () => {
    const endHr = process.hrtime.bigint();
    const durationMs = Number(endHr - startHr) / 1_000_000;
    if (res.statusCode < 400) {
      writeSuccessLog({
        level: "info",
        message: "request completed",
        requestId: (req as any).id,
        method: req.method,
        path: (req as any).originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: Math.round(durationMs),
      });
    }
  });
  next();
});

// cron.schedule('* * * * *', () => {
//     try {
//         AppointmentService.cancelUnpaidAppointments();
//     }
//     catch (err) {
//         console.error(err);
//     }
// });

app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Digital Sheba CRM server running..",
  });
});

app.use("/api/v1", router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
