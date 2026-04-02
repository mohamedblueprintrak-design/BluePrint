---
## Task ID: 4 - full-stack-developer
### Work Task
Create the full backend for Meetings (Prisma model + API route + hook) and wire the UI.

### Work Summary

**Files created:**
- `prisma/schema.prisma` — Added Meeting model, updated Organization/User/Project relations
- `src/app/api/meetings/route.ts` — GET/POST/PUT/DELETE with org isolation, demo mode
- `src/hooks/api/meetings.ts` — useMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting
- `src/hooks/api/index.ts` — Added meetings exports

**Files modified:**
- `src/app/api/utils/demo-config.ts` — Added 5 demo meetings to DEMO_DATA
- `src/app/dashboard/meetings/page.tsx` — Full rewrite: real API data, mutations, loading states, toasts

**Key implementation details:**
1. Prisma Meeting model uses String type (not enum) for status/type for flexibility
2. API normalizes date to YYYY-MM-DD string, includes project name via Prisma include
3. UI maps API UPPERCASE status to lowercase for display
4. Demo data attendees stored as JSON strings matching DB schema
5. Create dialog has controlled form with validation, type selector, and loading spinners
6. "Mark Complete" button calls PUT with status=COMPLETED

**Verification:** 0 new lint errors, prisma validate passes, dev server compiles successfully.
