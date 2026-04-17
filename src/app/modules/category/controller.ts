import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { categoryService } from './service';
import catchAsync from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await categoryService.getCategories();

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Categories fetched successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.updateCategory(String(req.params.categoryId), req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.deleteCategory(String(req.params.categoryId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

export const categoryController = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
