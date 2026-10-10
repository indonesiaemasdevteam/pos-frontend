import { generateId, mergeStringWithCharacter } from "src/lib/common/convert";
import { getDateTime } from "src/lib/common/dates";
import { query } from "src/lib/postgres";

const createDataToMerchantBank = async (
  user_id: string | number,
  merchant_id: string | number,
  requestBody: any
): Promise<any> => {
  try {
    const {
      bank_name,
      bank_no,
      province_id,
      regency_id,
      district_id,
      village_id,
      merchant_name,
      address,
    } = requestBody;
    let is_active = true;
    let today = new Date();
    let merchant_code = generateId(today, Number(user_id));
    let create_merchantbank = await query(
      "INSERT INTO m_merchant_banks (merchant_id, bank_name, bank_no, is_active, created_by, updated_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        merchant_id,
        bank_name,
        bank_no,
        is_active,
        user_id,
        user_id,
        getDateTime(today),
        getDateTime(today),
      ]
    );
    let update_curr_user = await query(
      "UPDATE m_users SET merchant_id = $1, is_active = $2 WHERE id = $3 RETURNING *",
      [merchant_id, is_active, user_id]
    );
    let update_curr_merchant = await query(
      "UPDATE m_merchants SET code = $1, is_active = $2, updated_at = $3 WHERE id = $4 RETURNING *",
      [merchant_code, is_active, getDateTime(today), merchant_id]
    );
    const q_data = `
      INSERT INTO m_merchant_branch (merchant_id, province_id, regency_id,
      district_id, village_id, name, address, created_at)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    let insert_branch = await query(q_data, [
      merchant_id,
      province_id,
      regency_id,
      district_id,
      village_id,
      merchant_name,
      address,
      getDateTime(today),
    ]);
    const new_branch = insert_branch.rows[0];
    await query(
      "INSERT INTO user_merchantbranch (user_id, merchant_branch_id) VALUES ($1, $2) RETURNING *",
      [user_id, new_branch.id]
    );
    let data_update = {
      user: update_curr_user.rows[0],
      merchant: update_curr_merchant.rows[0],
      merchant_bank: create_merchantbank.rows[0],
      merchant_info: new_branch,
    };
    return data_update;
  } catch (error) {
    throw error;
  }
};

const createDataMerchantBranch = async (
  user_id: string | number,
  merchant_id: string | number,
  requestBody: any
): Promise<any> => {
  try {
    const {
      province_id,
      regency_id,
      district_id,
      village_id,
      merchantbranch_name,
      address,
    } = requestBody;
    let today = new Date();

    const q_data = `
      INSERT INTO m_merchant_branch (merchant_id, province_id, regency_id,
      district_id, village_id, name, address, created_at)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    let insert_branch = await query(q_data, [
      merchant_id,
      province_id,
      regency_id,
      district_id,
      village_id,
      merchantbranch_name,
      address,
      getDateTime(today),
    ]);
    const new_branch = insert_branch.rows[0];
    await query(
      "INSERT INTO user_merchantbranch (user_id, merchant_branch_id) VALUES ($1, $2) RETURNING *",
      [user_id, new_branch.id]
    );
    return new_branch;
  } catch (error) {
    throw error;
  }
};

export { createDataToMerchantBank, createDataMerchantBranch };
