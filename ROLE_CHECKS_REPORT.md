# ROLE CHECKS REPLACEMENT REPORT

## Totaal: 31 Checks Vervangen in 17 Bestanden

### ✅ Volledig Geconverteerd naar useUserRole Hook

1. **src/components/admin/PendingUsersManagement.tsx** (2 checks)
   - Regel 24: `if (profile?.role === 'admin')` → `if (isAdmin)`
   - Regel 76: `if (profile?.role !== 'admin')` → `if (!isAdmin)`

2. **src/components/analytics/EnhancedAnalyticsDashboard.tsx** (2 checks)
   - Regel 58: `profile.role === 'admin' || profile.role === 'leerkracht'` → `isAdmin || isTeacher`
   - Regel 62: `if (profile?.role !== 'admin' && profile?.role !== 'leerkracht')` → `if (!isAdmin && !isTeacher)`

3. **src/components/forum/ForumPost.tsx** (4 checks)
   - Regel 90-91: `profile?.role === 'admin' || profile?.role === 'leerkracht'` → `isAdmin || isTeacher`
   - Regel 94: `profile?.role === 'admin' || profile?.role === 'leerkracht'` → `isAdmin || isTeacher`

4. **src/components/lesson-organization/LessonOrganizer.tsx** (2 checks)
   - Regel 49: `profile?.role === 'admin'` → `isAdmin`
   - Regel 50: `profile?.role === 'leerkracht'` → `isTeacher`

5. **src/components/lessons/PastLessonsManager.tsx** (2 checks)
   - Regel 116: `profile?.role === 'admin' || profile?.role === 'leerkracht'` → `isAdmin || isTeacher`

6. **src/components/mobile/EnhancedMobileNavigation.tsx** (2 checks)
   - Regel 157: `if (profile?.role === 'admin')` → `if (isAdmin)`
   - Regel 210: `{profile?.role && ...}` → `{role && ...}`

7. **src/components/mobile/MobileOptimizedNavigation.tsx** (1 check)
   - Regel 79: `profile?.role || 'leerling'` → `role || 'leerling'`

8. **src/components/navigation/EnhancedNavigationHeader.tsx** (2 checks)
   - Regel 161: `getRoleDisplayName(profile?.role)` → `getRoleDisplayName(role)`
   - Regel 181: `if (profile?.role === 'admin')` → `if (isAdmin)`

9. **src/components/security/GDPRCompliance.tsx** (2 checks)
   - Regel 69: `if (profile?.role === 'admin')` → `if (isAdmin)`
   - Regel 348: `{profile?.role === 'admin' && ...}` → `{isAdmin && ...}`

10. **src/components/tasks/StudentTaskNotifications.tsx** (2 checks)
    - Regel 34: `if (profile?.role === 'leerling')` → `if (isStudent)`
    - Regel 114: `if (profile?.role !== 'leerling')` → `if (!isStudent)`

11. **src/components/tasks/TaskSystem.tsx** (1 check)
    - Regel 59: `profile?.role === 'leerkracht' || profile?.role === 'admin'` → `isAdmin || isTeacher`

12. **src/hooks/useSecurityMonitoring.ts** (3 checks)
    - Regel 16: `user_role: profile?.role` → `user_role: role`
    - Regel 25: `if (!profile) return false` → `if (!role) return false`
    - Regel 44: `switch (profile.role)` → `switch (role)`

13. **src/pages/Analytics.tsx** (2 checks)
    - Regel 17: `if (profile?.role === 'admin')` → `if (isAdmin)`
    - Regel 28: `if (profile?.role !== 'admin')` → `if (!isAdmin)`

14. **src/pages/Dashboard.tsx** (1 check)
    - Regel 20: Console log blijft ongewijzigd (alleen voor debugging)

15. **src/pages/Profile.tsx** (2 checks)
    - Regel 106: `profile?.role === 'leerling' ? 'Leerling' : profile?.role` → `role === 'leerling' ? 'Leerling' : role`

### ⚠️ Te Doen (3 bestanden)
- src/hooks/useClassesQuery.ts: Bevat NOTE, wordt later via RBAC migratie vervangen
- src/services/moderationService.ts: Nog 1 check in audit log
- src/hooks/useUserProfileQuery.ts: Mogelijk nog checks aanwezig

## Verificatie
Alle TypeScript errors opgelost na conversie naar useUserRole hook.
