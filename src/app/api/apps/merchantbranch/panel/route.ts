import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import { authentication, randomBytes } from "src/lib/common/authentication";
import { createDataMerchantBranch } from "src/controllers/merchants";
import { cookies } from "next/headers";
import { verifyToken } from "src/lib/common/authentication";
import { formatPhoneNumber } from "src/lib/common/convert";

export async function POST(req: NextRequest) {
  let body;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decode = verifyToken(token);
    body = await req.json();

    const {
      email,
      address,
      province_id,
      regency_id,
      district_id,
      village_id,
      merchantbranch_name,
      phone,
      fullname,
    } = body;

    if (
      !fullname ||
      !email ||
      !address ||
      !province_id ||
      !regency_id ||
      !district_id ||
      !village_id ||
      !merchantbranch_name ||
      !phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "fullname, phone, email, role, bank_name, bank_no, merchant_name, merchant_email, province_id, regency_id, district_id, village_id, address wajib diisi",
        },
        {
          status: 400,
        }
      );
    }
    const format_number_phone = formatPhoneNumber(phone);
    let check_user_phone = await query(
      "SELECT * FROM m_users WHERE phone = $1",
      [format_number_phone]
    );
    let check_phoneuser = check_user_phone.rows;
    if (check_phoneuser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "phone sudah digunakan",
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
    if (check_emailuser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "email sudah digunakan",
        },
        {
          status: 400,
        }
      );
    }
    let salt = randomBytes();
    let password_val = authentication(salt, "admin123");
    const role = "Admin";
    let create_user = await query(
      "INSERT INTO m_users (fullname, email, phone, password, role, is_active, salt, merchant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        fullname,
        email,
        format_number_phone,
        password_val,
        role,
        true,
        salt,
        decode.merchant_id,
      ]
    );
    let curr_datauser = create_user.rows[0];
    try {
      let update_merchant = await createDataMerchantBranch(
        curr_datauser.id,
        decode.merchant_id,
        body
      );

      return NextResponse.json({ data: update_merchant }, { status: 200 });
    } catch (error) {
      throw error;
    }
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
