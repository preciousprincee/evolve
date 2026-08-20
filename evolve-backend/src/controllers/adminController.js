import { asyncHandler } from '../utils/asyncHandler.js';
import { listUsers, getUserDetail } from '../services/adminService.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { page, pageSize, search } = req.query;
  const result = await listUsers({
    page: page ? Number(page) : 1,
    pageSize: pageSize ? Number(pageSize) : 25,
    search: search || '',
  });
  res.json(result);
});

export const getUser = asyncHandler(async (req, res) => {
  const result = await getUserDetail(req.params.userId);
  res.json(result);
});
