"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Input,
  Row,
  Pagination,
  PaginationItem,
  PaginationLink,
  Spinner,
} from "reactstrap";
import classnames from "classnames";
import { toast } from "react-toastify";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";

import TableFilters from "./TableFilters";
import AddUserDrawer from "./AddUserDrawer";
import EditUserDialog from "./EditUserDialog";
import DeleteUserDialog from "./DeleteUserDialog";

import { DUMMY_COUNTRIES } from "./dummy";
import type { RoleValue, User as UserType, UserListTableProps } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const STATUS_BADGE: Record<string, string> = {
  active: "success",
  inactive: "secondary",
  pending: "warning",
};

const getRoleIcon = (role: RoleValue) => {
  switch (role) {
    case "superadmin":
      return <i className="ri-vip-crown-line text-warning me-1" />;
    case "superuser":
      return <i className="ri-star-line text-purple me-1" />;
    case "admin":
      return <i className="ri-shield-check-line text-primary me-1" />;
    default:
      return <i className="ri-user-line text-muted me-1" />;
  }
};

// ─── Debounced Input ──────────────────────────────────────────────────────────
const DebouncedInput = ({
  value: init,
  onChange,
  placeholder,
  debounce = 400,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounce?: number;
}) => {
  const [val, setVal] = useState(init);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => onChange(val), debounce);
    return () => clearTimeout(t);
  }, [val]);

  return (
    <Input
      value={val}
      onChange={e => setVal(e.target.value)}
      placeholder={placeholder}
      style={{ width: 220 }}
    />
  );
};

const columnHelper = createColumnHelper<UserType>();

// ─── Component ────────────────────────────────────────────────────────────────
const UserListTable = ({
  session,
  countriesdata,
  onDataChange,
}: UserListTableProps) => {
  const { lang: locale } = useParams();
  const countries = countriesdata ?? DUMMY_COUNTRIES;
  const isSuperAdmin = session?.user?.roles?.some(
    (r: any) => r.role === "superadmin"
  );

  // ── Server-side state ─────────────────────────────────────────────────────
  const [data, setData] = useState<UserType[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Dialogs ───────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status }),
        ...(sorting[0] && {
          sortBy: sorting[0].id,
          order: sorting[0].desc ? "desc" : "asc",
        }),
      });

      const res = await fetch(`/api/apps/users/panel?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");

      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, role, status, sorting]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, role, status, pageSize, sorting]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    (updated: UserType) => {
      setData(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      fetchUsers();
      onDataChange?.();
    },
    [fetchUsers, onDataChange]
  );

  const handleDelete = useCallback(
    (userId: string) => {
      setData(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, deletedAt: new Date().toISOString(), status: "inactive" }
            : u
        )
      );
      toast.success("User deleted successfully");
      fetchUsers();
      onDataChange?.();
    },
    [fetchUsers, onDataChange]
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }: any) => (
          <input
            type="checkbox"
            className="form-check-input"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }: any) => (
          <input
            type="checkbox"
            className="form-check-input"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      columnHelper.accessor("name", {
        header: "User",
        cell: ({ row }) => {
          const { image, name, username } = row.original;
          return (
            <div className="d-flex align-items-center gap-2">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="rounded-circle avatar-xs"
                />
              ) : (
                <div
                  className="avatar-xs rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  {getInitials(name)}
                </div>
              )}
              <div>
                <p className="mb-0 fw-semibold">{name}</p>
                <small className="text-muted">@{username}</small>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: ({ row }) => (
          <small className="text-muted">{row.original.email}</small>
        ),
      }),
      columnHelper.accessor("roles", {
        header: "Role",
        cell: ({ row }) => {
          const roleVal = row.original.roles?.[0]?.role ?? "user";
          return (
            <div className="d-flex align-items-center text-capitalize">
              {getRoleIcon(roleVal)}
              <span>{roleVal}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`badge bg-${STATUS_BADGE[row.original.status] ?? "secondary"}-subtle text-${STATUS_BADGE[row.original.status] ?? "secondary"} text-capitalize`}
          >
            {row.original.status}
          </span>
        ),
      }),
      columnHelper.accessor("country", {
        header: "Country",
        cell: ({ row }) => {
          const { country, countryCode } = row.original;
          return (
            <div className="d-flex align-items-center gap-1">
              {countryCode && (
                <img
                  src={`https://flagcdn.com/w40/${countryCode}.png`}
                  alt={country}
                  width={20}
                  height={14}
                  style={{ objectFit: "cover", borderRadius: 2 }}
                />
              )}
              <small>{country || "-"}</small>
            </div>
          );
        },
      }),
      columnHelper.accessor("phoneNumber", {
        header: "Phone",
        cell: ({ row }) => (
          <small className="text-muted">
            {(row.original.phoneNumber || "-").replace(/-/g, "")}
          </small>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Joined",
        cell: ({ row }) => <small>{formatDate(row.original.createdAt)}</small>,
      }),
      columnHelper.accessor("lastLogin", {
        header: "Last Login",
        cell: ({ row }) => <small>{formatDate(row.original.lastLogin)}</small>,
      }),
      columnHelper.display({
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => {
          const isDeleted = !!row.original.deletedAt;
          return (
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-soft-primary"
                title="Edit"
                onClick={() => {
                  setSelectedUser(row.original);
                  setEditOpen(true);
                }}
              >
                <i className="ri-pencil-line" />
              </button>
              <button
                className="btn btn-sm btn-soft-danger"
                title="Delete"
                disabled={isDeleted || !isSuperAdmin}
                onClick={() => {
                  if (!isDeleted && isSuperAdmin) {
                    setSelectedUser(row.original);
                    setDeleteOpen(true);
                  }
                }}
              >
                <i className="ri-delete-bin-line" />
              </button>
              <Link
                href={`/apps-user-lists/view/${row.original.id}`}
                className="btn btn-sm btn-soft-info"
                title="View"
              >
                <i className="ri-eye-line" />
              </Link>
            </div>
          );
        },
      }),
    ],
    [locale, isSuperAdmin]
  );

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
  });

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  return (
    <>
      <Card>
        <CardHeader>
          <h5 className="card-title mb-0">
            User Management
            <span className="text-muted fw-normal ms-2 fs-13">
              ({total} users)
            </span>
          </h5>
        </CardHeader>
        <CardBody>
          <TableFilters
            role={role}
            setRole={setRole}
            status={status}
            setStatus={setStatus}
          />

          <Row className="align-items-center mb-3 g-2">
            <Col sm="auto">
              <Input
                type="select"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ width: 80 }}
              >
                {[10, 25, 50].map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Input>
            </Col>
            <Col sm="auto" className="ms-auto">
              <div className="d-flex gap-2">
                <DebouncedInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search user..."
                />
                <button className="btn btn-soft-secondary">
                  <i className="ri-download-2-line me-1" />
                  Export
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setAddOpen(true)}
                >
                  <i className="ri-add-line me-1" />
                  Add User
                </button>
              </div>
            </Col>
          </Row>

          <div
            className="table-responsive"
            style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}
          >
            <table className="table table-hover table-nowrap align-middle mb-0">
              <thead
                className="table-light"
                style={{ position: "sticky", top: 0, zIndex: 2 }}
              >
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => (
                      <th
                        key={header.id}
                        className={classnames(
                          "text-uppercase fs-12 fw-semibold",
                          {
                            "cursor-pointer user-select-none":
                              header.column.getCanSort(),
                          }
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getIsSorted() === "asc" && (
                          <i className="ri-arrow-up-s-line ms-1" />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <i className="ri-arrow-down-s-line ms-1" />
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={table.getVisibleFlatColumns().length}
                      className="text-center py-4"
                    >
                      <Spinner size="sm" className="me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={table.getVisibleFlatColumns().length}
                      className="text-center text-muted py-4"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className={row.getIsSelected() ? "table-active" : ""}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">
              Showing {Math.min((page - 1) * pageSize + 1, total)}–
              {Math.min(page * pageSize, total)} of {total} users
            </small>
            <Pagination className="mb-0">
              <PaginationItem disabled={page === 1}>
                <PaginationLink first onClick={() => setPage(1)} />
              </PaginationItem>
              <PaginationItem disabled={page === 1}>
                <PaginationLink previous onClick={() => setPage(p => p - 1)} />
              </PaginationItem>
              {pageNumbers.map(n => (
                <PaginationItem key={n} active={n === page}>
                  <PaginationLink onClick={() => setPage(n)}>
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem disabled={page >= totalPages}>
                <PaginationLink next onClick={() => setPage(p => p + 1)} />
              </PaginationItem>
              <PaginationItem disabled={page >= totalPages}>
                <PaginationLink last onClick={() => setPage(totalPages)} />
              </PaginationItem>
            </Pagination>
          </div>
        </CardBody>
      </Card>

      <AddUserDrawer
        open={addOpen}
        handleClose={() => setAddOpen(false)}
        userData={data}
        setData={setData}
        countries={countries}
      />

      {selectedUser && (
        <EditUserDialog
          open={editOpen}
          setOpen={setEditOpen}
          data={selectedUser}
          session={session}
          countries={countries}
          onSave={handleSave}
        />
      )}

      {selectedUser && (
        <DeleteUserDialog
          open={deleteOpen}
          setOpen={setDeleteOpen}
          user={selectedUser}
          onDelete={handleDelete}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
};

export default UserListTable;
