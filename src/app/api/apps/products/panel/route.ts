import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import { cookies } from "next/headers";
import { verifyToken } from "src/lib/common/authentication";
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

    const { category_id, product_name, description, photo } = body;

    if (!category_id || !product_name || !description || !photo) {
      return NextResponse.json(
        {
          success: false,
          error:
            "category_id, product_name, description, photo address wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    const insert_product = await query(
      "INSERT INTO m_products (merchant_id, category_id, product_name, description, photo) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [decode.merchant_id, category_id, product_name, description, photo]
    );

    return NextResponse.json({ data: insert_product.rows[0] }, { status: 200 });
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
