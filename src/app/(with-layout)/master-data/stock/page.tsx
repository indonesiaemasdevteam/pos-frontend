import MasterDataCrudPage from "@components/MasterData/MasterDataCrudPage";

export default function StockPage() {
  return (
    <MasterDataCrudPage
      entityName="Stock"
      entityNamePlural="Stock"
      storageKey="pos-master-stock"
      icon="ri-stack-line"
      fields={[
        {
          key: "product",
          label: "Produk",
          required: true,
          placeholder: "Nama produk",
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
        { key: "unit", label: "Satuan", required: true, placeholder: "pcs" },
        {
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          format: "status",
          options: [
            { label: "Tersedia", value: "active" },
            { label: "Habis", value: "inactive" },
          ],
        },
      ]}
    />
  );
}
