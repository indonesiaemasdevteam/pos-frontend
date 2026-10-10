import type {
  User, Country, LoginHistory, HistoryLog, DeletionLog, Role
} from './types'

// ─── Countries ────────────────────────────────────────────────────────────────
export const DUMMY_COUNTRIES: Country[] = [
  { name: 'Indonesia',     code: 'id', phoneCode: '+62' },
  { name: 'United States', code: 'us', phoneCode: '+1'  },
  { name: 'United Kingdom',code: 'gb', phoneCode: '+44' },
  { name: 'Singapore',     code: 'sg', phoneCode: '+65' },
  { name: 'Malaysia',      code: 'my', phoneCode: '+60' },
  { name: 'Japan',         code: 'jp', phoneCode: '+81' },
  { name: 'Australia',     code: 'au', phoneCode: '+61' },
  { name: 'Germany',       code: 'de', phoneCode: '+49' },
  { name: 'France',        code: 'fr', phoneCode: '+33' },
  { name: 'Canada',        code: 'ca', phoneCode: '+1'  },
  { name: 'India',         code: 'in', phoneCode: '+91' },
  { name: 'South Korea',   code: 'kr', phoneCode: '+82' },
]

// ─── Login History (per user) ─────────────────────────────────────────────────
export const DUMMY_LOGIN_HISTORY: LoginHistory[] = [
  { id: 'lh-001', userId: 'usr-001', timestamp: '2025-05-27T07:30:00Z', ipAddress: '180.244.12.5',  userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0' },
  { id: 'lh-002', userId: 'usr-001', timestamp: '2025-05-26T14:22:00Z', ipAddress: '180.244.12.5',  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604.1' },
  { id: 'lh-003', userId: 'usr-001', timestamp: '2025-05-24T09:11:00Z', ipAddress: '103.82.14.20',  userAgent: 'Mozilla/5.0 (Macintosh) Chrome/124.0' },
  { id: 'lh-004', userId: 'usr-001', timestamp: '2025-05-20T22:05:00Z', ipAddress: '103.82.14.20',  userAgent: 'Mozilla/5.0 (X11; Ubuntu) Firefox/125.0' },
  { id: 'lh-005', userId: 'usr-001', timestamp: '2025-05-18T11:45:00Z', ipAddress: '36.73.100.8',   userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0' },
  { id: 'lh-006', userId: 'usr-001', timestamp: '2025-05-15T08:30:00Z', ipAddress: '180.244.12.5',  userAgent: 'Mozilla/5.0 (Windows NT 10.0) Edg/124.0' },
]

// ─── History Log (audit trail) ────────────────────────────────────────────────
export const DUMMY_HISTORY_LOG: HistoryLog[] = [
  { id: 'hl-001', entityId: 'usr-001', entityType: 'user', actionType: 'update', performedById: 'usr-001', performedAt: '2025-05-20T10:00:00Z', reason: 'Updated email address' },
  { id: 'hl-002', entityId: 'usr-001', entityType: 'user', actionType: 'update', performedById: 'usr-001', performedAt: '2025-04-15T08:30:00Z', reason: 'Changed phone number' },
  { id: 'hl-003', entityId: 'usr-001', entityType: 'user', actionType: 'update', performedById: 'usr-002', performedAt: '2025-03-10T14:00:00Z', reason: 'Role updated by admin' },
  { id: 'hl-004', entityId: 'usr-001', entityType: 'user', actionType: 'update', performedById: 'usr-001', performedAt: '2025-02-01T09:00:00Z', reason: 'Profile photo updated' },
]

// ─── Users ────────────────────────────────────────────────────────────────────
export const DUMMY_USERS: User[] = [
  {
    id: 'usr-001', name: 'Budi Santoso', username: 'budi.santoso',
    email: 'budi.santoso@example.com', status: 'active',
    roles: [{ id: 'role-4', role: 'superadmin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'Indonesia', countryCode: 'id', region: 'DKI Jakarta', city: 'Jakarta',
    phoneNumber: '+62-81234567890',
    createdAt: '2024-01-10T08:00:00Z', updatedAt: '2025-05-20T10:00:00Z',
    lastLogin: '2025-05-27T07:30:00Z', isDeleted: false,
    twoFactorEnabled: true, twoFactorVerified: true,
    loginHistory: DUMMY_LOGIN_HISTORY,
    historyLog: DUMMY_HISTORY_LOG,
    deletionLog: [],
  },
  {
    id: 'usr-002', name: 'Alice Johnson', username: 'alice.j',
    email: 'alice.j@example.com', status: 'active',
    roles: [{ id: 'role-2', role: 'admin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'United States', countryCode: 'us', region: 'California', city: 'San Francisco',
    phoneNumber: '+1-4155552671',
    createdAt: '2024-02-15T10:00:00Z', updatedAt: '2025-05-26T14:20:00Z',
    lastLogin: '2025-05-26T14:20:00Z', isDeleted: false,
    twoFactorEnabled: true, twoFactorVerified: true,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-003', name: 'Rizky Pratama', username: 'rizky.p',
    email: 'rizky.p@example.com', status: 'active',
    roles: [{ id: 'role-3', role: 'superuser', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'Indonesia', countryCode: 'id', region: 'Jawa Barat', city: 'Bandung',
    phoneNumber: '+62-81298765432',
    createdAt: '2024-03-20T09:00:00Z', updatedAt: '2025-05-25T11:00:00Z',
    lastLogin: '2025-05-25T11:00:00Z', isDeleted: false,
    twoFactorEnabled: false, twoFactorVerified: false,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-004', name: 'James Tan', username: 'james.tan',
    email: 'james.tan@example.com', status: 'inactive',
    roles: [{ id: 'role-1', role: 'user', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'Singapore', countryCode: 'sg', region: 'Central Region', city: 'Singapore',
    phoneNumber: '+65-91234567',
    createdAt: '2024-04-05T12:00:00Z', updatedAt: '2025-03-10T09:45:00Z',
    lastLogin: '2025-03-10T09:45:00Z', isDeleted: false,
    twoFactorEnabled: false, twoFactorVerified: false,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-005', name: 'Siti Rahayu', username: 'siti.r',
    email: 'siti.r@example.com', status: 'active',
    roles: [{ id: 'role-1', role: 'user', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'Indonesia', countryCode: 'id', region: 'Jawa Tengah', city: 'Semarang',
    phoneNumber: '+62-85812345678',
    createdAt: '2024-05-18T07:30:00Z', updatedAt: '2025-05-27T06:00:00Z',
    lastLogin: '2025-05-27T06:00:00Z', isDeleted: false,
    twoFactorEnabled: false, twoFactorVerified: false,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-006', name: 'Liam Clarke', username: 'liam.c',
    email: 'liam.c@example.com', status: 'pending',
    roles: [{ id: 'role-1', role: 'user', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'United Kingdom', countryCode: 'gb', region: 'England', city: 'London',
    phoneNumber: '+44-7911123456',
    createdAt: '2024-06-01T14:00:00Z', updatedAt: '2024-06-01T14:00:00Z',
    lastLogin: '2024-06-01T14:00:00Z', isDeleted: false,
    twoFactorEnabled: false, twoFactorVerified: false,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-007', name: 'Hanako Yamamoto', username: 'hanako.y',
    email: 'hanako.y@example.com', status: 'active',
    roles: [{ id: 'role-2', role: 'admin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'Japan', countryCode: 'jp', region: 'Tokyo', city: 'Tokyo',
    phoneNumber: '+81-9012345678',
    createdAt: '2024-06-22T08:00:00Z', updatedAt: '2025-05-24T10:15:00Z',
    lastLogin: '2025-05-24T10:15:00Z', isDeleted: false,
    twoFactorEnabled: true, twoFactorVerified: true,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-008', name: 'Ahmad Farid', username: 'ahmad.f',
    email: 'ahmad.f@example.com', status: 'inactive',
    roles: [{ id: 'role-1', role: 'user', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'Malaysia', countryCode: 'my', region: 'Kuala Lumpur', city: 'Kuala Lumpur',
    phoneNumber: '+60-123456789',
    createdAt: '2024-07-10T11:00:00Z', updatedAt: '2025-02-28T08:30:00Z',
    lastLogin: '2025-02-28T08:30:00Z', isDeleted: false,
    twoFactorEnabled: false, twoFactorVerified: false,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-009', name: 'Emily Davis', username: 'emily.d',
    email: 'emily.d@example.com', status: 'active',
    roles: [{ id: 'role-3', role: 'superuser', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'Australia', countryCode: 'au', region: 'New South Wales', city: 'Sydney',
    phoneNumber: '+61-412345678',
    createdAt: '2024-08-03T13:00:00Z', updatedAt: '2025-05-27T05:00:00Z',
    lastLogin: '2025-05-27T05:00:00Z', isDeleted: false,
    twoFactorEnabled: true, twoFactorVerified: false,
    loginHistory: [], historyLog: [], deletionLog: [],
  },
  {
    id: 'usr-010', name: 'Nina Leclerc', username: 'nina.l',
    email: 'nina.l@example.com', status: 'inactive',
    roles: [{ id: 'role-1', role: 'user', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
    country: 'France', countryCode: 'fr', region: 'Île-de-France', city: 'Paris',
    phoneNumber: '+33-612345678',
    createdAt: '2024-10-01T09:00:00Z', updatedAt: '2025-04-01T00:00:00Z',
    lastLogin: '2025-01-15T12:00:00Z',
    deletedAt: '2025-04-01T00:00:00Z', isDeleted: true,
    twoFactorEnabled: false, twoFactorVerified: false,
    loginHistory: [], historyLog: [],
    deletionLog: [{
      id: 'dl-001', deletedId: 'usr-010', deletedType: 'user',
      deletedById: 'usr-001', deletedAt: '2025-04-01T00:00:00Z',
      reason: 'Account inactive for more than 3 months'
    }],
  },
]

// ─── Mock session (superadmin) ─────────────────────────────────────────────────
export const DUMMY_SESSION = {
  user: {
    id:    'usr-001',
    name:  'Budi Santoso',
    email: 'budi.santoso@example.com',
    roles: [{ id: 'role-4', role: 'superadmin' as const, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'system', updatedBy: 'system' }],
  }
}