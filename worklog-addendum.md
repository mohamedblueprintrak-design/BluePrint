---
## Task ID: 7 - full-stack-developer
### Work Task
Enhance Dashboard Home with Workload Widget, enhance Blue AI Assistant with engineering-specific context and quick suggestions, and add Engineering Workflow Types.

### Work Summary

#### Task 1: Team Workload Widget on Dashboard Home

**Files Modified:**

1. **src/app/api/dashboard/route.ts** - Enhanced dashboard API:
   - Added user lookup from JWT token to get organizationId (previously hardcoded)
   - Added workload computation: queries all active users in the organization, fetches their tasks, and computes per-user stats:
     - `activeTasks`: count of TODO, IN_PROGRESS, IN_REVIEW tasks
     - `overdueTasks`: count of tasks past dueDate that aren't DONE
     - `completionRate`: percentage of DONE tasks out of total
     - `loadStatus`: 'ok' (≤3 active, no overdue), 'moderate' (4-5 active), 'overloaded' (6+ active or any overdue)
   - Added `workload` array to the dashboard API JSON response

2. **src/components/dashboard/dashboard-home.tsx** - Added Workload section:
   - New "Team Workload" Card between charts row and bottom row
   - Displays each team member as a row with: avatar, name, role, active tasks count, overdue count (conditional), completion rate percentage
   - Visual indicators per member:
     - Green (emerald): ok load — CheckCircle2 icon, green dot, green tinted background
     - Yellow (amber): moderate load — AlertCircle icon, amber dot, amber tinted background  
     - Red: overloaded — AlertTriangle icon, red dot, red tinted background
   - Scrollable container (max-h-80) with custom scrollbar
   - Bilingual labels (Arabic/English) for "Active", "Overdue", "Done"
   - Dark theme styling matching existing cards (bg-slate-800/50, border-slate-700/50)
   - Added imports for UserCircle, AlertTriangle, CheckCircle2 icons

#### Task 2: Enhanced Blue AI Assistant

**Files Modified:**

3. **src/app/api/ai/route.ts** - Complete rewrite with context support:
   - Moved base system prompt as `BASE_SYSTEM_PROMPT` constant
   - Added `context` parameter to POST body (optional, backward compatible)
   - Added 4 context-specific data fetching functions:
     - `getProjectContext(orgId)`: Queries active projects with status, progress, budget, spent, client, dates
     - `getMunContext(orgId)`: Queries MUN_SUBMISSION and MUN_APPROVAL workflow phases with interactions, rejection count, notes
     - `getFinancialContext(orgId)`: Queries all projects, outstanding invoices, top BOQ items; computes total budget, spent, outstanding amounts
     - `getOverdueContext(orgId)`: Queries overdue tasks (dueDate < now, status != DONE) with project, assignee, priority, days overdue
   - Each context function returns structured text data appended to the system prompt
   - Optional JWT authentication: if Authorization header present, resolves orgId from user's organizationId
   - System message handling: preserves existing system message from client, appends context data
   - Full backward compatibility: no context = same behavior as before

4. **src/components/dashboard/ai-chat-page.tsx** - Enhanced with quick suggestions:
   - Added `QuickSuggestion` interface with: id, context, labelAr/En, promptAr/En, icon, color
   - 4 quick suggestion buttons (always visible above input):
     - "تحليل ملاحظات البلدية" / "Analyze MUN Notes" (orange, Building2 icon, context: 'mun')
     - "ملخص مالي" / "Financial Summary" (emerald, DollarSign icon, context: 'financial')
     - "حالة المشروع" / "Project Status" (blue, FolderKanban icon, context: 'project')
     - "مهام متأخرة" / "Overdue Tasks" (red, AlertTriangle icon, context: 'overdue')
   - `handleSend` refactored to accept optional `customInput` and `customContext` parameters
   - `handleQuickSuggestion(suggestion)`: sends contextualized prompt with context to /api/ai
   - Quick suggestions bar placed between chat messages and input area
   - Each button disabled when typing, shows icon + label, has themed hover color
   - All existing functionality preserved: welcome message, suggested prompts, typing indicator, message bubbles, timestamps, clear chat

#### Task 3: Engineering Workflow Types

5. **src/types/index.ts** - Added engineering workflow types at end of file:
   - `enum WorkflowPhaseType` (20 phases: ARCHITECTURAL_SKETCH through CONTRACT_SIGNING)
   - `enum WorkflowPhaseCategory` (5 categories: ARCHITECTURAL, STRUCTURAL, MEP, GOVERNMENT, CONTRACTING)
   - `enum WorkflowPhaseStatus` (6 statuses: NOT_STARTED through REJECTED)
   - `enum InteractionType` (3 types: APPROVE, REJECT, COMMENT)
   - `interface WorkflowPhase` (with User relation, SLA fields, dependency)
   - `interface ClientInteraction` (with phase relation, response tracking)
   - `interface AuditLog` (with organization, user, entity type/action)
   - `interface SLAInfo` (totalDays, daysRemaining, isOverdue, isWarning, status)

#### Verification:
- `bun run lint` passes with 0 errors
- Dev server returns HTTP 200 on /
- All existing functionality preserved (no breaking changes)
- 5 files modified, 0 new files created
