import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "src/lib/common/authentication";
import { query } from "src/lib/postgres";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      throw Error("pengguna tidak ditemukan");
    }
    const decode = verifyToken(token);

    if (!decode) {
      throw Error("pengguna tidak ditemukan");
    }
    const data_merchant = await query(
      "SELECT * FROM m_merchant_branch WHERE id = $1",
      [decode.merchant_id]
    );
    return NextResponse.json(
      {
        response: {
          ...data_merchant.rows[0],
          role: decode.role,
          user_id: decode.user_id,
        },
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

export async function PATCH(req: NextRequest) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decode = verifyToken(token);
    const body = await req.json();
    const branchId = body.merchant_branch_id;
    const branchName = String(body.merchant_branch_name ?? "").trim();
    const address = String(body.address ?? "").trim();
    const { province_id, regency_id, district_id, village_id } = body;

    if (
      !branchId ||
      !branchName ||
      !address ||
      !province_id ||
      !regency_id ||
      !district_id ||
      !village_id
    ) {
      return NextResponse.json(
        { error: "Nama, alamat, dan seluruh wilayah wajib diisi" },
        { status: 400 }
      );
    }

    const validRegion = await query(
      `SELECT v.id
       FROM m_villages v
       JOIN m_districts d ON d.id = v.district_id
       JOIN m_regencies r ON r.id = d.regency_id
       JOIN m_provinces p ON p.id = r.province_id
       WHERE p.id = $1 AND r.id = $2 AND d.id = $3 AND v.id = $4
       LIMIT 1`,
      [province_id, regency_id, district_id, village_id]
    );
    if (!validRegion.rowCount) {
      return NextResponse.json(
        { error: "Kombinasi wilayah tidak valid" },
        { status: 400 }
      );
    }

    const updated = await query(
      `UPDATE m_merchant_branch
       SET name = $1, address = $2, province_id = $3, regency_id = $4,
           district_id = $5, village_id = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND merchant_id = $8
       RETURNING *`,
      [
        branchName,
        address,
        province_id,
        regency_id,
        district_id,
        village_id,
        branchId,
        decode.merchant_id,
      ]
    );

    if (!updated.rowCount) {
      return NextResponse.json(
        { error: "Cabang merchant tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ response: updated.rows[0] });
  } catch (error) {
    if (
      error instanceof Error &&
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal memperbarui cabang merchant" },
      { status: 500 }
    );
  }
}
