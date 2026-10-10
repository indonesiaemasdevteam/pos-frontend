import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import axios from "axios";

async function createRegencies(data_prov: any[]) {
  if (data_prov.length === 0) return [];

  const values: any[] = [];
  const placeholders = data_prov.map((prov, index) => {
    const offset = index * 3;
    values.push(prov.code, prov.name, prov.regency_id);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
  });

  const result = await query(
    `
      INSERT INTO m_districts (code, name, regency_id)
      VALUES ${placeholders.join(", ")} RETURNING *
    `,
    values
  );
  return result.rows;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const regency_id = searchParams.get("regency_id");
    if (!regency_id) {
      return NextResponse.json(
        { error: "regency_id wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await query(
      "SELECT * FROM m_districts WHERE regency_id = $1 ORDER BY name",
      [regency_id]
    );
    if (existing.rowCount) {
      return NextResponse.json({
        data: existing.rows,
        total: existing.rowCount,
      });
    }

    const regencies_data = await query(
      "SELECT * FROM m_regencies where id = $1",
      [regency_id]
    );
    const total = regencies_data.rowCount;
    if (total) {
      const fetch_data = await axios.get(
        `https://wilayah.id/api/districts/${regencies_data.rows[0].code}.json`
      );
      const { data: regencies } = fetch_data.data;
      if (regencies.length === 0) {
        return NextResponse.json({
          data: [],
          total: 0,
        });
      }
      const map_data = regencies.map((data: any) => ({
        ...data,
        regency_id,
      }));

      const create_data = await createRegencies(map_data);
      return NextResponse.json({
        data: create_data,
        total: create_data.length,
      });
    }
    return NextResponse.json({ data: [], total: 0 });
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
