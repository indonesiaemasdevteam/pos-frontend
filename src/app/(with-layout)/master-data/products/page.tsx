import MasterDataCrudPage from "@components/MasterData/MasterDataCrudPage";

export default function ProductsPage() {
  return (
    <MasterDataCrudPage
      entityName="Product"
      entityNamePlural="Products"
      storageKey="pos-master-products"
      icon="ri-shopping-bag-3-line"
      fields={[
        {
          key: "name",
          label: "Nama Produk",
          required: true,
          placeholder: "Nama produk",
        },
        { key: "sku", label: "SKU", required: true, placeholder: "SKU-001" },
        {
          key: "category",
          label: "Kategori",
          required: true,
          placeholder: "Kategori produk",
        },
        {
          key: "price",
          label: "Harga",
          type: "number",
          required: true,
          placeholder: "0",
          format: "currency",
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
