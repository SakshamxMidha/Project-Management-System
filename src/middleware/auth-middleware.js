import { User } from "../models/user-models.js";
import { APiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new APiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -emailVerificationExpiry -emailVerificationToken -refreshTokens",
    );

    if (!user) {
      throw new APiError(401, "Invalid Access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new APiError(401, "Invalid Access token");
  }
});
