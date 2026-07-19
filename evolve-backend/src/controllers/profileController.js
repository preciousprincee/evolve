import { asyncHandler } from '../utils/asyncHandler.js';
import * as profileService from '../services/profileService.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const result = await profileService.getFullProfile(req.userId);
  res.status(200).json(result);
});

export const patchMyProfile = asyncHandler(async (req, res) => {
  // req.body was already replaced with parsed/validated data by the
  // validate() middleware — safe to pass straight through.
  const updated = await profileService.updateProfile(req.userId, req.body);
  res.status(200).json({ profile: updated });
});
