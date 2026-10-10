import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { insertNewUser } from "src/controllers/users";
import { query } from "src/lib/postgres";

const ALLOWED_SORT_FIELDS = [
  "name",
  "email",
  "createdAt",
  "status",
  "username",
  "lastLogin",
];

export async function GET(req: Request) {
  try {
    const users = await query("SELECT * FROM m_users", []);
    const total = users.rowCount;
    return NextResponse.json({
      data: users.rows,
      total,
    });
    // return NextResponse.json({
    //   data: users,
    //   page,
    //   limit,
    //   total,
    //   totalPages: Math.ceil(total / limit),
    // });
  } catch (err: any) {
    console.error("❌ ERROR in GET /api/apps/users/panel:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        error: true,
        status: 500,
        message: err.message || "Unexpected server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
    console.log("body =>", body);

    const insert_new = await insertNewUser(body);
    return NextResponse.json({ data: insert_new }, { status: 200 });
  } catch (error: any) {
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Body wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    let error_response = error.message ? error.message : "Server Error";
    return NextResponse.json({ error: error_response }, { status: 500 });
  }
}
