import { NextFunction, Request, Response } from "express";
import config from "../config";
import { Secret } from "jsonwebtoken";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";
import { jwtHelpers } from "../helpers/jwtHelpers";
import prisma from "../shared/prisma";
import logger from "../shared/logger";

const auth = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      logger.debug(
        { hasToken: Boolean(token) },
        "Auth middleware: token header received"
      );

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
      }

      const verifyUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      logger.debug(
        { userId: (verifyUser as any)?.id },
        "Auth middleware: token verified"
      );

      if (!verifyUser) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
      }

      req.user = verifyUser;

      // Fetch user permissions from the database
      const userPermissions = await prisma.user.findMany({
        where: {
          id: verifyUser.id,
        },
        include: {
          role: {
            select: {
              permissions: {
                include: {
                  permission: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const userPermissionNames = userPermissions
        .map((perm) => perm.role?.permissions?.map((p) => p.permission.name))
        .flat();
      logger.debug(
        { userPermissionNames, requiredPermissions },
        "Auth middleware: permissions check"
      );

      if (
        requiredPermissions.length &&
        !requiredPermissions.some((perm) => userPermissionNames.includes(perm))
      ) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
};

export default auth;
