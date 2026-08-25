import mongoose, { Schema } from "mongoose";
import bcryct from "bcryct";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const UserSchema = new Schema(
  {
    avatar: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: `https://placehold.co/200x200`,
        localPath: "",
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      trim: true,
      required: true,
    },
    passwords: {
      type: String,
      required: [true, "password is required"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwords")) return next();

  this.passwords = await bcryct.hash(this.passwords, 10);
  next();
});

UserSchema.methods.isPasswordCorrect = async function (passwords) {
  return await bcrypt.compare(passwords, this.passwords);
};

UserSchema.methods.generateAceessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};

UserSchema.methods.generateTempToken = function () {
  const unHashToken = crypto.randomBytes(20).toString("hex");

  const HashToken = crypto
    .createHash("sha256")
    .update(unHashToken)
    .digest("hex");

  const TokenExpiry = Date.now() + 20 * 60 * 1000; //20mins
  return { unHashToken, HashToken, TokenExpiry };
};

export const User = mongoose.model("User", UserSchema);
