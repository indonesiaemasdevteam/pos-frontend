import MasterDataCrudPage from "@components/MasterData/MasterDataCrudPage";

export default function AssetsPage() {
  return (
    <MasterDataCrudPage
      entityName="Asset"
      entityNamePlural="Assets"
      storageKey="pos-master-assets"
      icon="ri-archive-stack-line"
      fields={[
        {
          key: "name",
          label: "Nama Asset",
          required: true,
          placeholder: "Nama asset",
        },
        {
          key: "code",
          label: "Kode Asset",
          required: true,
          placeholder: "AST-001",
        },
        {
          key: "category",
          label: "Kategori",
          required: true,
          placeholder: "Kategori asset",
        },
        {
          key: "condition",
          label: "Kondisi",
          type: "select",
          required: true,
          options: [
            { label: "Baik", value: "Baik" },
            { label: "Perlu Perbaikan", value: "Perlu Perbaikan" },
            { label: "Rusak", value: "Rusak" },
          ],
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
