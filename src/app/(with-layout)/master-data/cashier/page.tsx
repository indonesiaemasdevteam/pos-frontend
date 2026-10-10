import MasterDataCrudPage from "@components/MasterData/MasterDataCrudPage";

export default function CashierPage() {
  return (
    <MasterDataCrudPage
      entityName="Kasir"
      entityNamePlural="Kasir"
      storageKey="pos-master-cashier"
      icon="ri-cash-line"
      fields={[
        {
          key: "name",
          label: "Nama Kasir",
          required: true,
          placeholder: "Nama lengkap kasir",
        },
        {
          key: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "kasir@email.com",
        },
        {
          key: "branch",
          label: "Cabang",
          required: true,
          placeholder: "Nama cabang",
        },
        {
          key: "shift",
          label: "Shift",
          type: "select",
          required: true,
          options: [
            { label: "Pagi", value: "Pagi" },
            { label: "Siang", value: "Siang" },
            { label: "Malam", value: "Malam" },
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
