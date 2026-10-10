import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import axios from "axios";

async function createProvinces(data_prov: any[]) {
  if (data_prov.length === 0) return [];

  const values: any[] = [];
  const placeholders = data_prov.map((prov, index) => {
    const offset = index * 2;
    values.push(prov.code, prov.name);
    return `($${offset + 1}, $${offset + 2})`;
  });

  const result = await query(
    `
      INSERT INTO m_provinces (code, name)
      VALUES ${placeholders.join(", ")}
      RETURNING id, name, name
    `,
    values
  );
  return result.rows;
}
export async function GET(req: Request) {
  try {
    const provinces = await query("SELECT * FROM m_provinces", []);
    const total = provinces.rowCount;
    if (total === 0) {
      const fetch_data = await axios.get(
        "https://wilayah.id/api/provinces.json"
      );
      const { data } = fetch_data.data;
      const create_data = await createProvinces(data);
      return NextResponse.json({
        data: create_data,
        total: create_data.length,
      });
    }
    return NextResponse.json({
      data: provinces.rows,
      total,
    });
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
