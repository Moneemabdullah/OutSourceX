export interface TErrorSource {
    path: string;
    message: string;
}

export interface IErrorResponse {
    statusCode?: number;
    success: boolean;
    message: string;
    errorSource?: TErrorSource[];
    error?: unknown;
    stack?: string;
}
