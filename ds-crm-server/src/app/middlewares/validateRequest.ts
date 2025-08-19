import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import logger from "../shared/logger";

const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.debug(
        { bodyKeys: Object.keys(req.body || {}) },
        "Validating request body"
      );
      await schema.parseAsync({
        body: req.body,
      });
      return next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;
