import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { NextRequest, NextResponse } from "next/server";

interface DataTokenProps {
  user_id: number;
  merchant_id: number;
  role: string;
  fullname: string;
}
const SECRET = "FOODORDER-REST-API";

const randomBytes = () => crypto.randomBytes(64).toString("base64");
const authentication = (salt: string, password: string) => {
  return crypto
    .createHmac("sha256", [salt, password].join("/"))
    .update(SECRET)
    .digest("hex");
};
export const verifyToken = (token: string): any => {
  return jwt.verify(token, SECRET) as { id: string };
};
const verifyPassword = (password: string, hash: string) => {
  let curr_hash = hash;
  curr_hash = curr_hash.replace("$2y$", "$2b$"); // Convert Laravel's format to Node.js compatible
  let check_password = bcrypt.compare(password, curr_hash);
  return check_password;
};

const generateToken = async (data: DataTokenProps): Promise<string> => {
  return jwt.sign(data, SECRET, { expiresIn: "7d" });
};
const generateUserToken = async (user: any): Promise<any | null> => {
  const { id: user_id, email, merchant_id, role, fullname } = user;
  let userToken = await generateToken({ user_id, merchant_id, role, fullname });
  const response_data = NextResponse.json({
    response: {
      user_id,
      email,
      merchant_id,
      token: userToken,
    },
  });
  response_data.cookies.set("token", userToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response_data;
};

export {
  randomBytes,
  authentication,
  verifyPassword,
  generateToken,
  generateUserToken,
};
