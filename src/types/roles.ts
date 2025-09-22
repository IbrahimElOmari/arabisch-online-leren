export const APP_ROLES = ['admin', 'leerkracht', 'leerling'] as const;
export type AppRole = typeof APP_ROLES[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Beheerder',
  leerkracht: 'Leerkracht', 
  leerling: 'Leerling'
};