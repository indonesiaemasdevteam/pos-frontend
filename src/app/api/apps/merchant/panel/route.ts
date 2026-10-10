import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import { getDateTime } from "src/lib/common/dates";
import { authentication, randomBytes } from "src/lib/common/authentication";
import { createDataToMerchantBank } from "src/controllers/merchants";

// export async function GET(req: Request) {
//   try {
//     const merchants = await query("SELECT * FROM m_merchants", []);
//     const total = merchants.rowCount;
//     return NextResponse.json({
//       data: merchants.rows,
//       total,
//     });
//   } catch (err: any) {
//     console.error("❌ ERROR in GET /api/apps/users/panel:", {
//       name: err.name,
//       message: err.message,
//       stack: err.stack,
//     });

//     return NextResponse.json(
//       {
//         error: true,
//         status: 500,
//         message: err.message || "Unexpected server error",
//       },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();

    const {
      email,
      password,
      bank_name,
      bank_no,
      merchant_name,
      merchant_email,
      address,
      province_id,
      regency_id,
      district_id,
      village_id,
    } = body;
    console.log("body =>", body);

    if (
      !email ||
      !password ||
      !bank_name ||
      !bank_no ||
      !merchant_name ||
      !merchant_email ||
      !address ||
      !province_id ||
      !regency_id ||
      !district_id ||
      !village_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "email, password, role, bank_name, bank_no, merchant_name, merchant_email, province_id, regency_id, district_id, village_id, address wajib diisi",
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
    let password_val = authentication(salt, password);
    const role = "Owner";
    let create_user = await query(
      "INSERT INTO m_users (email, password, role, is_active, salt) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [email, password_val, role, false, salt]
    );
    let curr_datauser = create_user.rows[0];
    let today = new Date();
    let create_merchant = await query(
      "INSERT INTO m_merchants (name, email, address, is_active, created_by, updated_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        merchant_name,
        merchant_email,
        address,
        false,
        curr_datauser.id,
        curr_datauser.id,
        getDateTime(today),
        getDateTime(today),
      ]
    );
    let curr_datamerchant = create_merchant.rows[0];
    try {
      let update_merchant = await createDataToMerchantBank(
        curr_datauser.id,
        curr_datamerchant.id,
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
