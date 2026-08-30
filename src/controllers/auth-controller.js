import { User } from "../models/user-models.js";
import { APiresponse } from "../utils/api-response.js";
import { APiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  emailPasswordreset,
  emailVerification,
  SendEmail,
} from "../utils/mail.js";
import Mailgen from "mailgen";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAceessTokenandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAceessToken();
    const refreshTokens = user.generateRefreshToken();

    user.refreshTokens = refreshTokens;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshTokens };
  } catch (error) {
    throw new APiError(
      500,
      "Something went wrong while generating access token",
      [],
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, role, password } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new APiError(
      409,
      "User with this email or username already exist",
      [],
    );
  }

  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });

  const { unHashToken, HashToken, TokenExpiry } = user.generateTempToken();

  user.emailVerificationToken = HashToken;
  user.emailVerificationExpiry = TokenExpiry;

  await user.save({ validateBeforeSave: false });

  await SendEmail({
    email: user?.email,
    subject: "Verify your email",
    mailgenContent: emailVerification(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -emailVerificationExpiry -emailVerificationToken -refreshTokens",
  );

  if (!createdUser) {
    throw new APiError(500, "something went wrong", []);
  }

  return res
    .status(201)
    .json(
      new APiresponse(
        200,
        { user: createdUser },
        "user successfully created and verification email is sent on your email",
      ),
    );
});

export const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new APiError(402, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new APiError(403, "user does not exist");
  }

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new APiError(404, "wrong password");
  }

  const { accessToken, refreshTokens } =
    await generateAceessTokenandRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -emailVerificationExpiry -emailVerificationToken -refreshTokens",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshTokens, options)
    .json(
      new APiresponse(
        200,
        { user: loggedInUser, accessToken, refreshTokens },
        "User logged in successfully",
      ),
    );
});

export const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshTokens: "",
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APiresponse(200, {}, "user logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new APiresponse(200, req.user, "User fetched successfully"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new APiError(500, "Email verification token is missing");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new APiError(500, "Email verification token is invalid or expired");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new APiresponse(
        200,
        { isEmailVerified: true },
        "your Email is now verified",
      ),
    );
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new APiError(500, "User not found");
  }

  if (user.isEmailVerified) {
    throw new APiError(500, "User already verified");
  }

  const { unHashToken, HashToken, TokenExpiry } = user.generateTempToken();

  user.emailVerificationToken = HashToken;
  user.emailVerificationExpiry = TokenExpiry;

  await user.save({ validateBeforeSave: false });

  await SendEmail({
    email: user?.email,
    subject: "Verify your email",
    mailgenContent: emailVerification(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
    ),
  });

  return res.status(200).json(new APiresponse(200, "verification email sent"));
});

export const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new APiError(401, "Unauthorized access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new APiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshTokens) {
      throw new APiError(401, "Refresh Token is expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshTokens: new_refreshToken } =
      await generateAceessTokenandRefreshToken(user._id);

    user.refreshTokens = new_refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", new_refreshToken, options)
      .json(
        new APiresponse(
          200,
          { accessToken, refreshToken: new_refreshToken },
          "Access Token refresh",
        ),
      );
  } catch (error) {
    throw new APiError(401, "Invalid Refresh Token");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new APiError(404, "User not found");
  }

  const { unHashToken, HashToken, TokenExpiry } = user.generateTempToken();

  user.forgotPasswordToken = HashToken;
  user.forgotPasswordExpiry = TokenExpiry;

  await user.save({ validateBeforeSave: false });

  await SendEmail({
    email: user?.email,
    subject: "Password Reset email request",
    mailgenContent: emailPasswordreset(
      user.username,
      `${process.env.PASSWORD_RESET_URL}/${unHashToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new APiresponse(200, {}, "password reset email sent on your mail id"),
    );
});

export const resetForgotPassword = asyncHandler(async (req, res) => {
  const { Token } = req.params;
  const { newPass } = req.body;

  let hashedToken = crypto.createHash("sha256").update(Token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new APiError(489, "Token is invalid or expired");
  }

  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  user.password = newPass;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new APiresponse(200, {}, "Password changed successfully"));
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPass, newPass } = req.body;

  const user = await User.findById(req.user._id);

  const isPassValid = await user.isPasswordCorrect(oldPass);

  if (!isPassValid) {
    throw new APiError(404, "Incorrect old password");
  }

  user.password = newPass;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new APiresponse(200, {}, "Password changed successfully"));
});
