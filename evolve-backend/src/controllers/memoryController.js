import { asyncHandler } from '../utils/asyncHandler.js';
import * as memoryService from '../services/memoryService.js';

export const getMemories = asyncHandler(async (req, res) => {
  const memories = await memoryService.listMemories(req.userClient, req.query.category);
  res.status(200).json({ memories });
});

export const postMemory = asyncHandler(async (req, res) => {
  const memory = await memoryService.createMemory(req.userClient, req.userId, req.body);
  res.status(201).json({ memory });
});

export const patchMemory = asyncHandler(async (req, res) => {
  const memory = await memoryService.updateMemory(req.userClient, req.params.id, req.body);
  res.status(200).json({ memory });
});

export const removeMemory = asyncHandler(async (req, res) => {
  const result = await memoryService.deleteMemory(req.userClient, req.params.id);
  res.status(200).json(result);
});
