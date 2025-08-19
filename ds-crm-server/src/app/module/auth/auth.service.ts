/* eslint-disable @typescript-eslint/no-explicit-any */
import { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../../config";
import httpStatus from "http-status";
import prisma from "../../shared/prisma";
import { UserStatus } from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import sendEmail from "../../helpers/sendEmail";
import { fileUploader } from "../../helpers/fileUploader";

const createUser = async (req: any) => {
  const file = req.file;
  const data = req.body;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);

    data.user.profileImg = uploadToCloudinary?.secure_url;
  }

  const hashedPassword: string = await bcrypt.hash(
    data.password,
    Number(config.salt_rounds)
  );

  const userData = {
    email: data.user.email,
    password: hashedPassword,
    tenantId: data.user.tenantId,
  };

  const profileData = {
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    gender: data.user.gender,
    address: data.user.address,
    contactNumber: data.user.contactNumber,
    profileImg: data.user.profileImg,
  };

  const result = await prisma.$transaction(async (transClient) => {
    const user = await transClient.user.create({
      data: userData,
    });

    const createProfileData = await transClient.profile.create({
      data: { ...profileData, userId: user.id },
    });
    const permData = data.user.permissions.map((perm: any) => {
      return {
        userId: user.id,
        permissionId: perm,
      };
    });

    return createProfileData;
  });
  return result;
};

const loginUser = async (payload: { id: string; password: string }) => {
  const { id, password } = payload;

  const user = await prisma.user.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid User Id");
  }

  console.log(`user`,user);

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user?.password as string
  );

  if (!isPasswordCorrect) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect Password");
  }

  const jwtPayload = { id: user.id,  role: user.userType };

  const token = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.jwt_secret as Secret,
    Number(config.jwt.jwt_secret_expires_in)
  );

  const refreshToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.refresh_token_secret as Secret,
    Number(config.jwt.refresh_token_expires_in)
  );

  return {
    accessToken: token,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as string
    );
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Not Authorized");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: decodedData.id,
      isDeleted: false,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id,  role: user.userType  },
    config.jwt.jwt_secret as string,
    Number(config.jwt.jwt_secret_expires_in)
  );

  return {
    accessToken,
  };
};

const changePassword = async (
  id: string,
  payload: { oldPassword: string; newPassword: string }
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
  });
  const isPasswordMatched = await bcrypt.compare(
    payload.oldPassword,
    user.password as string
  );
  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Wrong Password");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.salt_rounds) as number
  );

  const updatePassword = await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  });
  return updatePassword;
};

const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  const token = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.reset_pass_secret as Secret,
    Number(config.jwt.reset_pass_token_expires_in) as number
  );

  const resetPassLink = `${config.reset_pass_link}?id=${user.id}&token=${token}`;

  await sendEmail(
    user.email,
    "Reset Password",
    `
  <div className='mx-auto text-center'>
  <p>Dear User,<p/>
  <p>Please click on the link below to reset your password
  <a href=${resetPassLink}>
  <button>Reset Password<button/>
  </a> 
  </p>  
  </div>
    `
  );
};

const resetPassword = async (
  token: string,
  payload: { id: string; password: string }
) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: payload.id,
      status: UserStatus.ACTIVE,
    },
  });

  const isValidToken = jwtHelpers.verifyToken(
    token,
    config.jwt.reset_pass_secret as Secret
  );

  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid token");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.salt_rounds) as number
  );

  const updatePassword = await prisma.user.update({
    where: {
      id: payload.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return updatePassword;
};

export const authServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  createUser,
};
