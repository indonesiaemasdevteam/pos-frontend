import MasterDataCrudPage from "@components/MasterData/MasterDataCrudPage";

export default function InventoryPage() {
  return (
    <MasterDataCrudPage
      entityName="Inventory"
      entityNamePlural="Inventory"
      storageKey="pos-master-inventory"
      icon="ri-archive-drawer-line"
      fields={[
        {
          key: "name",
          label: "Nama Barang",
          required: true,
          placeholder: "Nama barang inventory",
        },
        {
          key: "code",
          label: "Kode Barang",
          required: true,
          placeholder: "INV-001",
        },
        {
          key: "branch",
          label: "Cabang",
          required: true,
          placeholder: "Nama cabang",
        },
        {
          key: "quantity",
          label: "Jumlah",
          type: "number",
          required: true,
          placeholder: "0",
          format: "number",
        },
        {
          key: "unit",
          label: "Satuan",
          required: true,
          placeholder: "pcs",
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          format: "status",
          options: [
            { label: "Aktif", value: "active" },
            { label: "Nonaktif", value: "inactive" },
          ],
        },
      ]}
    />
  );
}
