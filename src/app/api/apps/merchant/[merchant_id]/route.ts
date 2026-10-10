import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ merchant_id: string }> }
) {
  try {
    const { merchant_id } = await context.params;
    const data_merchant = await query(
      "SELECT id AS merchant_id, code, name as merchant_name, email, address, logo, is_active, created_at, updated_at  FROM m_merchants WHERE id = $1",
      [merchant_id]
    );
    return NextResponse.json(
      {
        response: data_merchant.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Errors" },
      { status: 500 }
    );
  }
}
