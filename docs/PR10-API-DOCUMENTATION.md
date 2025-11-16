# PR10 - Teacher Tools API Documentation

## Overview

This document describes the API endpoints and RPC functions available for the Teacher Tools & Class Management feature set introduced in PR10.

## Authentication & Authorization

All endpoints require authentication via JWT token in the Supabase session. Role-based access control (RBAC) is enforced through Row-Level Security (RLS) policies and security definer functions.

**Required Roles:**
- `leerkracht` (Teacher) - Can access own classes and students
- `admin` - Can access all teacher functions across all classes

## Database RPC Functions

### 1. create_teacher_note

Creates a private note for a specific student. Only visible to the creating teacher and admins.

**Function Signature:**
```sql
create_teacher_note(
  p_student_id uuid,
  p_content text,
  p_is_flagged boolean DEFAULT false
)
RETURNS jsonb
```

**Authorization:** Teacher or Admin role required

**Input Parameters:**
- `p_student_id` (uuid, required) - ID of the student for whom the note is being created
- `p_content` (text, required) - Content of the note (no length limit, but recommended < 5000 chars)
- `p_is_flagged` (boolean, optional, default: false) - Whether to flag this note for special attention

**Output:**
Returns a JSON object containing the created note:
```json
{
  "id": "uuid-of-note",
  "student_id": "student-uuid",
  "content": "Note content here",
  "is_flagged": false,
  "teacher_id": "teacher-uuid",
  "created_at": "2025-11-16T10:00:00Z",
  "updated_at": "2025-11-16T10:00:00Z"
}
```

**Error Conditions:**
- `403 Forbidden` - User does not have teacher or admin role
- `404 Not Found` - Student ID does not exist
- `500 Internal Server Error` - Database error

**Example Usage (JavaScript/TypeScript):**
```typescript
const { data, error } = await supabase.rpc('create_teacher_note', {
  p_student_id: 'student-uuid-here',
  p_content: 'Student shows excellent progress in Arabic pronunciation.',
  p_is_flagged: false
});
```

---

### 2. fetch_teacher_notes

Retrieves all notes created by the authenticated teacher for a specific student.

**Function Signature:**
```sql
fetch_teacher_notes(
  p_student_id uuid
)
RETURNS SETOF jsonb
```

**Authorization:** Teacher (own notes) or Admin (all notes)

**Input Parameters:**
- `p_student_id` (uuid, required) - ID of the student whose notes to retrieve

**Output:**
Returns an array of JSON objects, each representing a note:
```json
[
  {
    "id": "note-uuid-1",
    "student_id": "student-uuid",
    "teacher_id": "teacher-uuid",
    "content": "First note content",
    "is_flagged": false,
    "created_at": "2025-11-15T14:00:00Z",
    "updated_at": "2025-11-15T14:00:00Z"
  },
  {
    "id": "note-uuid-2",
    "student_id": "student-uuid",
    "teacher_id": "teacher-uuid",
    "content": "Second note content",
    "is_flagged": true,
    "created_at": "2025-11-16T10:00:00Z",
    "updated_at": "2025-11-16T10:30:00Z"
  }
]
```

**Error Conditions:**
- `403 Forbidden` - User is not a teacher/admin or doesn't have access to this student
- `404 Not Found` - Student ID does not exist

**Example Usage:**
```typescript
const { data, error } = await supabase.rpc('fetch_teacher_notes', {
  p_student_id: 'student-uuid-here'
});
```

---

### 3. update_teacher_note

Updates an existing teacher note. Only the creating teacher (or admin) can update their notes.

**Function Signature:**
```sql
update_teacher_note(
  p_note_id uuid,
  p_content text DEFAULT NULL,
  p_is_flagged boolean DEFAULT NULL
)
RETURNS jsonb
```

**Authorization:** Must be the note creator or admin

**Input Parameters:**
- `p_note_id` (uuid, required) - ID of the note to update
- `p_content` (text, optional) - New content (if NULL, content unchanged)
- `p_is_flagged` (boolean, optional) - New flagged status (if NULL, status unchanged)

**Output:**
Returns the updated note as JSON:
```json
{
  "id": "note-uuid",
  "student_id": "student-uuid",
  "teacher_id": "teacher-uuid",
  "content": "Updated content",
  "is_flagged": true,
  "created_at": "2025-11-15T14:00:00Z",
  "updated_at": "2025-11-16T11:00:00Z"
}
```

**Error Conditions:**
- `403 Forbidden` - User is not the note creator or admin
- `404 Not Found` - Note ID does not exist

**Example Usage:**
```typescript
const { data, error } = await supabase.rpc('update_teacher_note', {
  p_note_id: 'note-uuid-here',
  p_content: 'Updated note with more details',
  p_is_flagged: true
});
```

---

### 4. delete_teacher_note

Permanently deletes a teacher note. Only the creating teacher (or admin) can delete their notes.

**Function Signature:**
```sql
delete_teacher_note(
  p_note_id uuid
)
RETURNS boolean
```

**Authorization:** Must be the note creator or admin

**Input Parameters:**
- `p_note_id` (uuid, required) - ID of the note to delete

**Output:**
Returns `true` on successful deletion

**Error Conditions:**
- `403 Forbidden` - User is not the note creator or admin
- `404 Not Found` - Note ID does not exist

**Example Usage:**
```typescript
const { data, error } = await supabase.rpc('delete_teacher_note', {
  p_note_id: 'note-uuid-here'
});
```

---

## Supabase Edge Functions

### 1. award-manual-xp

**Endpoint:** `POST /functions/v1/award-manual-xp`

**Description:** Allows a teacher or admin to manually award experience points (XP), badges, or coins to a student as a reward for performance, behavior, or achievement.

**Authorization:** Teacher or Admin role required (enforced via JWT claims)

**Request Body:**
```json
{
  "studentId": "uuid-of-student",
  "amount": 50,
  "reason": "Excellent homework submission on time",
  "rewardType": "points"
}
```

**Request Parameters:**
- `studentId` (string, required) - UUID of the student receiving the reward
- `amount` (number, required) - Amount of reward (XP points, number of badges, or coins). Must be > 0.
- `reason` (string, required) - Explanation for the reward (min 5 chars, max 500 chars)
- `rewardType` (string, optional, default: "points") - Type of reward: `"points"`, `"badge"`, or `"coins"`

**Response (200 OK):**
```json
{
  "success": true,
  "reward": {
    "id": "reward-uuid",
    "student_id": "student-uuid",
    "teacher_id": "teacher-uuid",
    "reward_type": "points",
    "reward_value": 50,
    "reason": "Excellent homework submission on time",
    "awarded_at": "2025-11-16T12:00:00Z"
  },
  "message": "Reward awarded successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (missing fields, invalid amount, etc.)
```json
{
  "error": "Invalid request: amount must be greater than 0"
}
```
- `403 Forbidden` - User does not have teacher/admin role
```json
{
  "error": "Unauthorized: Only teachers and admins can award rewards"
}
```
- `404 Not Found` - Student not found or not in teacher's classes
```json
{
  "error": "Student not found or not accessible"
}
```
- `500 Internal Server Error` - Database or server error
```json
{
  "error": "Internal server error: [details]"
}
```

**Side Effects:**
- Creates a record in `teacher_rewards` table
- May update student's XP/badge count in `profiles` table
- Creates an audit log entry in `audit_log` table

**Example cURL:**
```bash
curl -X POST 'https://xugosdedyukizseveahx.supabase.co/functions/v1/award-manual-xp' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "studentId": "student-uuid",
    "amount": 50,
    "reason": "Great participation",
    "rewardType": "points"
  }'
```

---

### 2. fetch-student-stats

**Endpoint:** `POST /functions/v1/fetch-student-stats`

**Description:** Retrieves aggregated statistics for a specific student, including completed tasks, earned XP, badges, and progress metrics. Used by teachers to view student performance.

**Authorization:** Teacher (for own students) or Admin

**Request Body:**
```json
{
  "studentId": "uuid-of-student"
}
```

**Request Parameters:**
- `studentId` (string, required) - UUID of the student whose stats to retrieve

**Response (200 OK):**
```json
{
  "stats": {
    "student_id": "student-uuid",
    "total_xp": 450,
    "total_badges": 3,
    "completed_tasks": 12,
    "pending_tasks": 2,
    "completion_rate": 85.7,
    "average_grade": 8.5,
    "last_activity": "2025-11-16T11:30:00Z",
    "enrolled_classes": [
      {
        "class_id": "class-uuid-1",
        "class_name": "Arabic Beginners",
        "progress_percentage": 75
      }
    ],
    "recent_rewards": [
      {
        "reward_type": "points",
        "amount": 50,
        "reason": "Excellent homework",
        "awarded_at": "2025-11-15T10:00:00Z"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid student ID
- `403 Forbidden` - Teacher does not have access to this student
- `404 Not Found` - Student not found
- `500 Internal Server Error` - Database error

**Example Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('fetch-student-stats', {
  body: { studentId: 'student-uuid-here' }
});
```

---

### 3. assign-task

**Endpoint:** `POST /functions/v1/assign-task`

**Description:** Allows a teacher to create and assign a new task (homework, assignment, quiz) to students in their class or to a specific level.

**Authorization:** Teacher (for own classes) or Admin

**Request Body:**
```json
{
  "levelId": "uuid-of-level",
  "title": "Arabic Grammar Exercise 3",
  "description": "Complete exercises 1-10 on verb conjugation",
  "dueDate": "2025-11-20T23:59:59Z",
  "requiredSubmissionType": "text",
  "gradingScale": 10
}
```

**Request Parameters:**
- `levelId` (string, required) - UUID of the level/class to assign the task to
- `title` (string, required) - Task title (max 200 chars)
- `description` (string, optional) - Detailed task description
- `dueDate` (string, optional) - ISO 8601 date-time when task is due
- `requiredSubmissionType` (string, required) - `"text"`, `"file"`, or `"both"`
- `gradingScale` (number, required) - Maximum points for the task (e.g., 10, 100)

**Response (200 OK):**
```json
{
  "task": {
    "id": "task-uuid",
    "level_id": "level-uuid",
    "title": "Arabic Grammar Exercise 3",
    "description": "Complete exercises 1-10 on verb conjugation",
    "due_date": "2025-11-20T23:59:59Z",
    "required_submission_type": "text",
    "grading_scale": 10,
    "created_by": "teacher-uuid",
    "created_at": "2025-11-16T12:00:00Z"
  },
  "message": "Task assigned successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (missing required fields, invalid dates)
- `403 Forbidden` - Teacher does not own the class/level
- `404 Not Found` - Level not found
- `500 Internal Server Error` - Database error

**Side Effects:**
- Creates a record in `tasks` table
- May trigger notifications to students in that level
- Creates an audit log entry

**Example Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('assign-task', {
  body: {
    levelId: 'level-uuid',
    title: 'Grammar Exercise',
    requiredSubmissionType: 'text',
    gradingScale: 10
  }
});
```

---

## Database Tables (for reference)

### teacher_notes
```sql
CREATE TABLE teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### teacher_rewards
```sql
CREATE TABLE teacher_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  reward_type TEXT NOT NULL, -- 'points', 'badge', 'coins'
  reward_value INTEGER NOT NULL,
  reason TEXT NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## RLS Policies

All tables have Row-Level Security enabled with the following access patterns:

**teacher_notes:**
- Teachers can SELECT, INSERT, UPDATE, DELETE their own notes
- Admins can SELECT, UPDATE, DELETE all notes
- Students cannot access notes

**teacher_rewards:**
- Teachers can SELECT their own awarded rewards and INSERT new rewards
- Admins can SELECT all rewards
- Students can SELECT rewards given to them (read-only)

**klassen (classes):**
- Teachers can SELECT, UPDATE their own classes
- Admins can SELECT, INSERT, UPDATE, DELETE all classes
- Students can SELECT classes they're enrolled in

---

## Rate Limiting & Quotas

Currently, no explicit rate limiting is enforced on these endpoints. However, standard Supabase Auth rate limits apply (60 requests/minute per user). Production deployments should consider implementing additional rate limiting for reward assignment to prevent abuse.

---

## Security Considerations

1. **JWT Validation:** All endpoints validate JWT tokens and extract user roles from claims
2. **RLS Enforcement:** Database-level security via RLS policies prevents unauthorized access
3. **Input Sanitization:** All text inputs are sanitized to prevent XSS/injection attacks
4. **Audit Logging:** All significant operations (reward assignment, note creation) are logged
5. **Role Separation:** Clear separation between teacher, admin, and student capabilities

---

## Testing Endpoints

For testing purposes, you can use the Supabase dashboard's SQL editor or make direct HTTP calls with valid JWT tokens. Ensure you have seeded test data (teachers, students, classes) before testing.

**Test Checklist:**
- ✅ Create note as teacher (should succeed)
- ✅ Create note as student (should fail with 403)
- ✅ Fetch notes for own students (should return notes)
- ✅ Fetch notes for other teacher's students (should return empty or error)
- ✅ Award XP with valid data (should succeed)
- ✅ Award negative XP (should fail validation)
- ✅ Assign task to own class (should succeed)
- ✅ Assign task to other teacher's class (should fail with 403)

---

## Support & Updates

For questions, issues, or feature requests related to these APIs, please:
- Check the main project README
- Review the test files for usage examples
- Consult the Supabase logs for detailed error information

API version: 1.0.0 (PR10)
Last updated: November 16, 2025
