// ─── Enums ────────────────────────────────────────────────────────────────────
export type RoleValue = "user" | "admin" | "superadmin" | "superuser";
export type UserStatus = "active" | "inactive" | "pending";
export type CalendarRole = "OWNER" | "EDITOR" | "VIEWER";
export type GuestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
export type MediaType = "VIDEO" | "IMAGE";

// ─── Role (Prisma model) ──────────────────────────────────────────────────────
export interface Role {
  id: string;
  role: RoleValue;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// ─── LoginHistory (Prisma model) ─────────────────────────────────────────────
export interface LoginHistory {
  id: string;
  userId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── HistoryLog (Prisma model) ────────────────────────────────────────────────
export interface HistoryLog {
  id: string;
  entityId: string;
  entityType: string; // "user", "post", "comment", etc.
  actionType: string; // "update", "delete", "background_job", etc.
  performedById?: string;
  performedAt: string;
  reason?: string;
}

// ─── DeletionLog (Prisma model) ───────────────────────────────────────────────
export interface DeletionLog {
  id: string;
  deletedId: string;
  deletedType: string;
  deletedById: string;
  deletedAt: string;
  reason?: string;
}

// ─── User (Prisma model — full) ───────────────────────────────────────────────
export interface User {
  id: string;
  name?: string;
  username: string;
  email: string;
  emailVerified?: string;
  image?: string;
  status: UserStatus;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  deletedAt?: string;
  isDeleted: boolean;

  // Contact
  phoneNumber?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;

  // 2FA
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;

  // Relations (loaded when viewing user detail)
  loginHistory?: LoginHistory[];
  historyLog?: HistoryLog[];
  deletionLog?: DeletionLog[];
}

// ─── Country (local util, not Prisma) ────────────────────────────────────────
export interface Country {
  name: string;
  code: string;
  phoneCode: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  name?: string;
  email: string;
  roles: Role[];
}

export interface Session {
  user: SessionUser;
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface UserListTableProps {
  session: any;
  countriesdata?: any[];
  onDataChange?: () => void; // ← tambah ini
}

export interface UserListProps {
  userData?: User[];
  session: Session;
  countriesdata: Country[];
}

export interface TableFiltersProps {
  role: string;
  setRole: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
}

export interface AddUserDrawerProps {
  open: boolean;
  handleClose: () => void;
  userData: User[];
  setData: React.Dispatch<React.SetStateAction<User[]>>;
  countries?: Country[];
}

export interface EditUserDialogProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  data: User | null;
  session: Session;
  countries?: Country[];
  onSave?: (updated: User) => void;
}

export interface DeleteUserDialogProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  user: User | null;
  onClose?: () => void;
  onDelete?: (userId: string) => void;
}

export interface UserViewProps {
  userId?: string;
  onBack?: () => void;
  onEdit?: (user: User) => void;
}
