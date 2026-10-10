import { NextRequest } from "next/server";
import { prisma } from "src/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export async function insertNewUser(requestBody: any): Promise<any | null> {
  try {
    let {
      name,
      email,
      password,
      username,
      role,
      country,
      countryCode,
      phoneNumber,
    } = requestBody;

    email = email.toLowerCase();
    // Validasi minimal
    if (!email || !password || !name || !username) {
      throw new Error("All fields are required");
    }

    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    if (username.length < 3 || username.length > 30) {
      throw new Error("Username must be between 3 and 30 characters");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    const check_email = await prisma.user.findFirst({
      where: {
        AND: [
          { isDeleted: false },
          {
            OR: [{ email }, { username }],
          },
        ],
      },
    });
    if (check_email) {
      throw new Error("User with this email or username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.$transaction(async tx => {
      // Ambil role yang diminta
      const selectedRole = await tx.role.findUnique({
        where: {
          role: role || "user",
        },
      });
      if (!selectedRole) {
        throw new Error("Specified role not found");
      }

      // Buat user dan connect role-nya
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          username,
          country,
          countryCode,
          phoneNumber,
          password: hashedPassword,
          status: "active",
          roles: {
            connect: { id: selectedRole.id },
          },
        },
        include: { roles: true },
      });

      return newUser;
    });

    const { password: _, ...safeUser } = createdUser;

    // Auto login if enabled

    return safeUser;

    // return NextResponse.json({
    //   message: "Registration successful",
    //   user: safeUser,
    // });
    // const insert_new = await prisma.user.create({
    //   data: {
    //     ...requestBody,
    //   },
    // });
    // return insert_new;
  } catch (error) {
    throw error;
  }
}
