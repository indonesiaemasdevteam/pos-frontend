import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import {
  authentication,
  generateUserToken,
} from "src/lib/common/authentication";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "email, password wajib diisi",
        },
        {
          status: 400,
        }
      );
    }
    let check_user_email = await query(
      "SELECT * FROM m_users WHERE email = $1",
      [email]
    );

    let check_emailuser = check_user_email.rows;

    if (check_emailuser.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "email tidak ditemukan",
        },
        {
          status: 400,
        }
      );
    }

    const expectedHash = authentication(
      check_emailuser[0].salt as string,
      password
    );
    if (check_emailuser[0].password !== expectedHash) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const response_data = await generateUserToken(check_emailuser[0]);
    return response_data;
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
