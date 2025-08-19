
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import ApiError from "../errors/ApiError";
import logger from "../shared/logger";
import config from "../config";
import { writeErrorLog } from "../shared/errorFileLogger";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "Something went wrong!";
  let error = err;
  // default status code from ApiError
  if (err instanceof ApiError && err.statusCode) {
    statusCode = err.statusCode;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation Error";
    error = err.issues?.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
  }

  //   if (err instanceof Prisma.PrismaClientValidationError) {
  //     message = "Validation Error";
  //     error = err.message;
  //   } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
  //     if (err.code === "P2002") {
  //       message = "Duplicate Key error";
  //       error = err.meta;
  //     }
  //   }

  if (err instanceof PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation Error";
    error = err.message;
  } else if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.CONFLICT;
      message = "Duplicate Key error";
      error = err.meta;
    }
  }

  // Log the error once with context
  logger.error(
    {
      err,
      statusCode,
      path: (req as any).originalUrl,
      requestId: (req as any).id,
      method: req.method,
    },
    message
  );

  // Persist error to error log file (non-blocking)
  writeErrorLog({
    level: "error",
    message,
    statusCode,
    path: (req as any).originalUrl,
    requestId: (req as any).id,
    method: req.method,
    errName: err?.name,
    errMessage: err?.message,
    errCode: err?.code,
  });

  res.status(statusCode).json({
    success,
    message,
    error,
    stack: config.env !== "production" ? err?.stack : undefined,
  });
};

export default globalErrorHandler;
