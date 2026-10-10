import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import axios from "axios";

async function createRegencies(data_prov: any[]) {
  if (data_prov.length === 0) return [];

  const values: any[] = [];
  const placeholders = data_prov.map((prov, index) => {
    const offset = index * 3;
    values.push(prov.code, prov.name, prov.district_id);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
  });

  const result = await query(
    `
      INSERT INTO m_villages (code, name, district_id)
      VALUES ${placeholders.join(", ")} RETURNING *
    `,
    values
  );
  return result.rows;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const district_id = searchParams.get("district_id");
    if (!district_id) {
      return NextResponse.json(
        { error: "district_id wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await query(
      "SELECT * FROM m_villages WHERE district_id = $1 ORDER BY name",
      [district_id]
    );
    if (existing.rowCount) {
      return NextResponse.json({
        data: existing.rows,
        total: existing.rowCount,
      });
    }

    const regencies_data = await query(
      "SELECT * FROM m_districts where id = $1",
      [district_id]
    );
    const total = regencies_data.rowCount;
    if (total) {
      const fetch_data = await axios.get(
        `https://wilayah.id/api/villages/${regencies_data.rows[0].code}.json`
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
        district_id,
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
