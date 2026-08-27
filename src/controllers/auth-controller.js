import { User } from "../models/user-models.js";
import { APiresponse } from "../utils/api-response.js";
import { APiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emailVerification, SendEmail } from "../utils/mail.js";
import Mailgen from "mailgen";

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

const registerUser = asyncHandler(async (req, res) => {
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

const userLogin = asyncHandler(async (req, res) => {
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

  const { accessToken, refreshTokens } = await generateAceessTokenandRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -emailVerificationExpiry -emailVerificationToken -refreshTokens",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accesstoken", accessToken, options)
    .cookie("refreshtoken", refreshTokens, options)
    .json(
      new APiresponse(
        200,
        { user: loggedInUser, accessToken, refreshTokens },
        "User logged in successfully",
      ),
    );
});

export { registerUser, userLogin };
