import { Response } from "express";

interface IResponseData<T> {
    httpStatusCode: number;
    success: boolean;
    message: string;
    data?: T;
}

export const sendResponse = (
    res: Response,
    responseData: IResponseData<unknown>,
) => {
    const { httpStatusCode, success, message, data } = responseData;
    res.status(httpStatusCode).json({
        success,
        message,
        data,
    });
};
