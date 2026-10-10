import { NextResponse } from "next/server";
import { query } from "src/lib/postgres";

export async function GET(
  req: Request,
  context: { params: Promise<{ merchant_id: string }> }
) {
  const { merchant_id } = await context.params;

  try {
    const list_merchants = await query(
      `SELECT merchantbranch_v.*, user_merchantbranch.merchant_branch_id,
	m_users.fullname, 
	m_users.photo, 
	m_users.phone,
	m_users.email
	from merchantbranch_v 
JOIN user_merchantbranch ON merchantbranch_v.user_id = user_merchantbranch.user_id
JOIN m_users ON user_merchantbranch.user_id = m_users.id 
WHERE merchantbranch_v.merchant_id = $1`,
      [merchant_id]
    );
    return NextResponse.json({
      data: list_merchants.rows,
      total: list_merchants.rowCount,
    });
  } catch (err: any) {
    console.error("❌ GET /api/apps/users/[id]:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
