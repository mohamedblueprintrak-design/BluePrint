---
Task ID: 7
Agent: full-stack-developer
Task: Wire Settings to real APIs

Work Log:
- Read settings-page.tsx (1392 lines) to understand all state, handlers, and JSX structure
- Read src/hooks/api/profile.ts for useChangePassword and useUpdateProfile hook signatures
- Read src/hooks/api/common.ts for PasswordChange and ProfileUpdate type definitions
- Read src/app/api/notifications/settings/route.ts to understand notification settings API (PUT body format)
- Read src/lib/api/fetch-client.ts to understand directApiRequest usage pattern
- Read src/context/auth-context.tsx to understand token handling (httpOnly cookies)

Changes made to src/components/settings/settings-page.tsx:

1. Added imports: useChangePassword, useUpdateProfile from @/hooks/api, useMutation from @tanstack/react-query, directApiRequest from @/lib/api/fetch-client, Loader2 from lucide-react

2. Wired handlePasswordChange to useChangePassword hook with validation, success/error toasts, loading state

3. Wired handleSaveNotifications to PUT /api/notifications/settings via useMutation + directApiRequest, with state-to-API field mapping

4. Wired handleSaveAppearance to useUpdateProfile hook, syncing theme and language to user profile

5. Added Loader2 loading spinners and disabled states to all 3 save buttons during API calls

Stage Summary:
- Password change now calls real API via useChangePassword hook
- Notification settings now persist to server via PUT /api/notifications/settings
- Appearance settings sync to user profile via useUpdateProfile hook
- All handlers show loading spinners and bilingual toasts
- ESLint: 0 errors, 0 warnings
