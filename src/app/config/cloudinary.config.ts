import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { envVars } from "./env.utils";
import AppError from "../errorHelpers/AppError";
import status from "http-status";

cloudinary.config({
    cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY_API_SECRET,
});

export const deleteFileFromCloudinary = async (url: string) => {
    try {
        const regex = /\/([^\/]+)\.[^\/]+$/;

        const match = url.match(regex);

        if (!match || match[1]) {
            const publicId = match[1];

            await cloudinary.uploader.destroy(publicId, {
                resource_type: "image",
            });
        }
    } catch (error) {
        throw new AppError(
            status.BAD_REQUEST,
            "Error deleting file from Cloudinary:" + (error as Error).message,
        );
    }
};

export const uploadFileToCloudinary = async (
    buffer: Buffer,
    fileName: string,
): Promise<UploadApiResponse> => {
    if (!buffer || !fileName) {
        throw new AppError(
            status.BAD_REQUEST,
            "Buffer and file name are required for upload",
        );
    }

    const extension = fileName.split(".").pop()?.toLowerCase();

    const fileNameWithoutExtension = fileName
        .split(".")
        .slice(0, -1)
        .join(".")
        ?.toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_-]/g, "");

    const uniqueName =
        Math.random().toString(36).substring(2) +
        "_" +
        Date.now() +
        "_" +
        fileNameWithoutExtension;

    const folder = extension === "pdf" ? "pdfs" : "images";

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
            resource_type: "auto",
            public_id: `healthcare/${folder}/${uniqueName}`,
            folder: `healthcare/${folder}`,
        },
        (error, result) => {
            if (error) {
                reject(
                    new AppError(
                        status.BAD_REQUEST,
                        "Error uploading file to Cloudinary: " + error.message,
                    ),
                );
            } else {
                resolve(result as UploadApiResponse);
            }
        ).end(buffer);
    });
};

export const cloudinaryUpload = cloudinary;
