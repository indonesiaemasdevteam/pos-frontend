import MasterDataCrudPage from "@components/MasterData/MasterDataCrudPage";

export default function UsersPage() {
  return (
    <MasterDataCrudPage
      entityName="User"
      entityNamePlural="Users"
      storageKey="pos-master-users"
      icon="ri-user-settings-line"
      fields={[
        {
          key: "name",
          label: "Nama",
          required: true,
          placeholder: "Nama lengkap",
        },
        {
          key: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "nama@email.com",
        },
        {
          key: "role",
          label: "Role",
          type: "select",
          required: true,
          options: [
            { label: "Owner", value: "Owner" },
            { label: "Admin", value: "Admin" },
            { label: "Cashier", value: "Cashier" },
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
