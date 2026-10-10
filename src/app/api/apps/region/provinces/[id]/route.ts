import { NextResponse } from "next/server";
import { query } from "src/lib/postgres";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const find_data = await query("SELECT * FROM m_provinces where id = $1", [
      id,
    ]);
    if (find_data.rowCount === 0)
      return NextResponse.json(
        { error: "data tidak ditemukan" },
        { status: 404 }
      );
    return NextResponse.json({
      data: find_data.rows[0],
    });
  } catch (err: any) {
    console.error("❌ GET /api/apps/users/[id]:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
