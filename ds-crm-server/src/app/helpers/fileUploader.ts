/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from "multer";
// import path from 'path'
// import fs from 'fs'
import { v2 as cloudinary } from "cloudinary";
import { ICloudinaryUploadResponse, IFile } from "../interfaces/file";
// import { ICloudinaryResponse, IFile } from "../app/interfaces/file";

cloudinary.config({
  cloud_name: "dbgrq28js",
  api_key: "173484379744282",
  api_secret: "eHKsVTxIOLl5oaO_BHxBQWAK3GA",
});

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// CSV file upload configuration
const uploadCSV = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept CSV files and text files

    console.log("file", file);
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      file.mimetype === "text/plain" ||
      file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadToCloudinary = async (
  file: any //Express.Multer.File
): Promise<ICloudinaryUploadResponse | undefined> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        // { folder: 'uploads' }, // Optional: specify Cloudinary folder
        (error: any, result: ICloudinaryUploadResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(file.buffer); // Use file.buffer to upload from memory
  });
};

const uploadFilesToCloudinary = async (files: IFile[]) => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
};

export const fileUploader = {
  upload,
  uploadCSV,
  uploadToCloudinary,
  uploadFilesToCloudinary,
};
