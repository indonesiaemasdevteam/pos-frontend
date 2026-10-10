import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;
const ENCRYPT_SECRET = process.env.ENCRYPT_SECRET;

if (!JWT_SECRET || !ENCRYPT_SECRET) {
  throw new Error("Missing JWT_SECRET or ENCRYPT_SECRET");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValidateOptions {
  includeToken?: boolean;
}

interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  roles: string[];
  status: string;
  lastLogin: string;
}

type ValidateResult =
  | {
      error: string;
      status: number;
      requiresTwoFactor?: boolean;
      username?: string;
    }
  | { user: Omit<Awaited<ReturnType<typeof fetchUser>>, "password"> }
  | { accessToken: string; refreshToken: string; encryptedUser: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetchUser = (email: string) =>
  prisma.user.findFirst({
    where: { email: email.toLowerCase(), isDeleted: false },
    include: { roles: true },
  });

const toWIBString = (date: Date | string) =>
  new Date(date).toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    hour12: false,
  });

const getCurrentWIBDate = () => new Date(Date.now() + 7 * 60 * 60 * 1000);

const generateAccessToken = (user: SafeUser) =>
  jwt.sign(
    { id: user.id, email: user.email, roles: user.roles, status: user.status },
    JWT_SECRET!,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (userId: string) =>
  jwt.sign({ id: userId }, JWT_SECRET!, { expiresIn: "7d" });

// ─── Main ─────────────────────────────────────────────────────────────────────

export const validateUser = async (
  email: string,
  password: string,
  { includeToken = true }: ValidateOptions = {}
): Promise<ValidateResult> => {
  try {
    const user = await fetchUser(email);

    if (!user) {
      return { error: "Email not found or user has been deleted", status: 404 };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: "Incorrect password", status: 401 };
    }

    if (user.status !== "active") {
      return { error: "User is inactive", status: 403 };
    }

    // 2FA check untuk admin
    const isAdmin = user.roles.some(r => r.role === "admin");
    if (isAdmin && user.twoFactorEnabled && !user.twoFactorVerified) {
      return {
        error: "Two-factor authentication required",
        requiresTwoFactor: true,
        username: user.email,
        status: 200,
      };
    }

    const now = getCurrentWIBDate();

    const [updatedUser, newRefreshToken] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: now },
        include: { roles: true },
      }),
      prisma.refreshToken.create({
        data: {
          token: generateRefreshToken(user.id),
          userId: user.id,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    if (!includeToken) {
      const { password: _pw, ...cleanUser } = updatedUser;
      return { user: cleanUser };
    }

    const safeUser: SafeUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      roles: updatedUser.roles.map(r => r.role),
      status: updatedUser.status,
      lastLogin: toWIBString(updatedUser.lastLogin),
    };

    const accessToken = generateAccessToken(safeUser);
    const encryptedUser = CryptoJS.AES.encrypt(
      JSON.stringify(safeUser),
      ENCRYPT_SECRET!
    ).toString();

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      encryptedUser,
    };
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Internal server error", status: 500 };
  }
};
