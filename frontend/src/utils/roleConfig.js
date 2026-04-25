export const ROLE_STORAGE_KEY = 'role_management_items';

export const DEFAULT_ROLE_ITEMS = [
  { id: 'default-admin', name: 'Admin', role: 'admin' },
  { id: 'default-technician', name: 'Technician', role: 'technician' },
  { id: 'default-user', name: 'User', role: 'user' },
];

const DEFAULT_ROLE_DESCRIPTIONS = {
  admin: 'full access',
  technician: 'update tickets',
  user: 'view, book, report',
};

export const normalizeRole = (value) => String(value || '').trim().toLowerCase();
export const toBackendRoleValue = (value) => normalizeRole(value).toUpperCase();

export const createRoleId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `role-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const uniqueByRole = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.role)) return false;
    seen.add(item.role);
    return true;
  });
};

export const loadRoleItems = () => {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    if (!raw) return DEFAULT_ROLE_ITEMS;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ROLE_ITEMS;

    const normalized = parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.role === 'string'
      )
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        role: normalizeRole(item.role),
      }))
      .filter((item) => item.name && item.role);

    if (normalized.length === 0) return DEFAULT_ROLE_ITEMS;

    return uniqueByRole(normalized);
  } catch {
    return DEFAULT_ROLE_ITEMS;
  }
};

export const saveRoleItems = (items) => {
  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(items));
};

export const getBackendRoleOptions = (roleItems = loadRoleItems()) => {
  const normalizedItems = uniqueByRole(
    roleItems
      .map((item) => ({
        id: item.id,
        name: String(item.name || '').trim(),
        role: normalizeRole(item.role),
      }))
      .filter((item) => item.name && item.role)
  );

  return normalizedItems.map((item) => {
    const description = DEFAULT_ROLE_DESCRIPTIONS[item.role];
    return {
      value: toBackendRoleValue(item.role),
      label: description ? `${item.name} — ${description}` : item.name,
      roleKey: item.role,
      name: item.name,
    };
  });
};
