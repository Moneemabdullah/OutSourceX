import status from "http-status";
import z from "zod";
import { IErrorResponse, TErrorSource } from "../interfaces/error.interface";

export const handleZodError = (err: z.ZodError): IErrorResponse => {
    const statusCode = status.BAD_REQUEST;
    let message = "Zod Validation Error";
    const errorSource: TErrorSource[] = [];

    err.issues.forEach((issue) => {
        errorSource.push({
            path: issue.path.join(" => "),
            message: issue.message,
        });
    });
    return { success: false, message, errorSource, statusCode };
};
