# 📊 Sequence Diagrams

Gedetailleerde sequence diagrams voor kritieke workflows.

---

## 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant SupabaseAuth
    participant Database
    participant EdgeFunction
    
    User->>WebApp: Navigate to /login
    WebApp->>User: Display login form
    User->>WebApp: Enter email + password
    WebApp->>SupabaseAuth: signInWithPassword()
    
    alt Valid credentials
        SupabaseAuth->>Database: Verify user in auth.users
        Database-->>SupabaseAuth: User found
        SupabaseAuth->>SupabaseAuth: Generate JWT token
        SupabaseAuth-->>WebApp: Return session + user
        WebApp->>Database: Query profiles WHERE id = user.id
        Database-->>WebApp: Return profile (role, name)
        WebApp->>WebApp: Store session in localStorage
        WebApp->>User: Redirect to dashboard
    else Invalid credentials
        SupabaseAuth-->>WebApp: Error: Invalid credentials
        WebApp->>User: Display error message
    end
    
    Note over WebApp,SupabaseAuth: Session refresh every 55 minutes
    WebApp->>SupabaseAuth: refreshSession()
    SupabaseAuth-->>WebApp: New JWT token
```

**Security Measures:**
- JWT tokens expire after 1 hour
- Refresh tokens valid for 30 days
- Rate limiting: 5 failed attempts = 15min lockout
- MFA optional (TOTP)

---

## 2. Exercise Completion & Adaptive Recommendation

```mermaid
sequenceDiagram
    participant Student
    participant UI
    participant API
    participant CurriculumService
    participant Analytics
    participant Database
    
    Student->>UI: Complete exercise
    UI->>API: POST /practice-sessions
    API->>Database: INSERT practice_sessions
    Database-->>API: Session ID
    
    API->>CurriculumService: calculateAdaptiveRecommendations(student_id)
    CurriculumService->>Analytics: getStudentAnalytics(student_id)
    Analytics->>Database: Query learning_analytics
    Database-->>Analytics: Return weak/strong areas
    Analytics-->>CurriculumService: Analytics data
    
    CurriculumService->>CurriculumService: Identify weak topics (< 60%)
    CurriculumService->>Database: Query content_library (weak topics)
    Database-->>CurriculumService: Remedial content
    
    CurriculumService->>CurriculumService: Identify strong topics (> 80%)
    CurriculumService->>Database: Query content_library (advanced)
    Database-->>CurriculumService: Enrichment content
    
    CurriculumService->>CurriculumService: Combine + prioritize
    CurriculumService-->>API: Recommended exercises[]
    API-->>UI: Return recommendations
    UI->>Student: Display "Aanbevolen voor jou"
```

**Recommendation Algorithm:**
1. Analyze last 20 practice sessions
2. Calculate accuracy per topic
3. Identify weak areas (<60% accuracy)
4. Identify strong areas (>80% accuracy)
5. Query content library for matching difficulty
6. Return top 5 recommendations per category

---

## 3. Forum Post with Auto-Moderation

```mermaid
sequenceDiagram
    participant Student
    participant UI
    participant EdgeFunction
    participant Moderation
    participant Database
    participant Teacher
    
    Student->>UI: Write forum post
    UI->>EdgeFunction: POST /forum-posts
    EdgeFunction->>Moderation: checkContent(post.body)
    
    alt Contains profanity
        Moderation-->>EdgeFunction: Flag: profanity_detected
        EdgeFunction->>Database: INSERT forum_posts (is_gerapporteerd: true)
        EdgeFunction->>Database: INSERT content_moderation
        Database-->>EdgeFunction: Post ID
        EdgeFunction-->>UI: 201 Created (flagged)
        UI->>Student: "Post submitted, awaiting review"
        
        Database->>Teacher: Notification: "Post flagged"
        Teacher->>UI: Review moderation queue
        Teacher->>EdgeFunction: POST /moderate (approve/reject)
        EdgeFunction->>Database: UPDATE forum_posts
        
        alt Approved
            Database->>Student: Notification: "Post approved"
        else Rejected
            Database->>Student: Notification: "Post rejected"
            EdgeFunction->>Database: INSERT user_warnings
        end
    else Content OK
        Moderation-->>EdgeFunction: OK
        EdgeFunction->>Database: INSERT forum_posts
        Database-->>EdgeFunction: Post ID
        EdgeFunction-->>UI: 201 Created
        UI->>Student: "Post published"
    end
```

**Moderation Rules:**
- Dutch profanity list: 500+ words
- English profanity list: 300+ words
- Arabic profanity list: 200+ words
- Pattern matching: URLs, emails, phone numbers
- Spam detection: Duplicate content within 1 hour

---

## 4. Teacher Grading with Rubric

```mermaid
sequenceDiagram
    participant Teacher
    participant UI
    participant API
    participant RubricService
    participant Database
    participant Student
    
    Teacher->>UI: Open task submissions
    UI->>API: GET /task-submissions?task_id=X
    API->>Database: Query task_submissions + student profiles
    Database-->>API: Submissions[]
    API-->>UI: Display submissions
    
    Teacher->>UI: Select submission to grade
    UI->>API: GET /grading-rubrics?task_id=X
    API->>RubricService: getRubricForTask(task_id)
    RubricService->>Database: Query grading_rubrics
    Database-->>RubricService: Rubric with criteria
    RubricService-->>API: Rubric object
    API-->>UI: Display rubric interface
    
    Teacher->>UI: Assign points per criterion
    Teacher->>UI: Add written feedback
    Teacher->>UI: Submit grade
    
    UI->>API: PATCH /task-submissions/:id
    API->>Database: UPDATE task_submissions (grade, feedback)
    Database->>Database: Trigger: update_student_progress
    Database-->>API: Updated submission
    
    API->>Database: INSERT notifications
    Database->>Student: Push notification: "Grade received"
    API-->>UI: 200 OK
    UI->>Teacher: "Grade submitted successfully"
```

**Rubric Structure:**
```json
{
  "rubric_id": "uuid",
  "task_id": "uuid",
  "criteria": [
    {
      "name": "Grammar",
      "max_points": 25,
      "description": "Correct use of grammar rules"
    },
    {
      "name": "Vocabulary",
      "max_points": 25,
      "description": "Appropriate vocabulary usage"
    },
    {
      "name": "Spelling",
      "max_points": 25,
      "description": "Accurate spelling"
    },
    {
      "name": "Structure",
      "max_points": 25,
      "description": "Clear structure and coherence"
    }
  ],
  "total_points": 100
}
```

---

## 5. Real-time Chat with Typing Indicator

```mermaid
sequenceDiagram
    participant StudentA
    participant WebAppA
    participant Realtime
    participant Database
    participant WebAppB
    participant StudentB
    
    StudentA->>WebAppA: Start typing
    WebAppA->>Realtime: presence.track({typing: true})
    Realtime->>WebAppB: presence.change event
    WebAppB->>StudentB: Show "Student A is typing..."
    
    StudentA->>WebAppA: Send message
    WebAppA->>Database: INSERT messages
    Database->>Realtime: NOTIFY new_message
    Realtime->>WebAppB: Push message via WebSocket
    WebAppB->>StudentB: Display message
    
    WebAppA->>Realtime: presence.track({typing: false})
    Realtime->>WebAppB: presence.change event
    WebAppB->>StudentB: Hide typing indicator
    
    StudentB->>WebAppB: Read message
    WebAppB->>Database: INSERT message_reads
    Database->>Realtime: NOTIFY message_read
    Realtime->>WebAppA: Push read receipt
    WebAppA->>StudentA: Update to "Gelezen ✓✓"
```

**Performance Optimizations:**
- Typing indicator debounced (300ms)
- Message batching (max 10 msgs/100ms)
- Presence heartbeat every 30s
- Auto-reconnect on disconnect

---

## 6. Payment with Webhook Verification

```mermaid
sequenceDiagram
    participant Student
    participant WebApp
    participant EdgeFunc
    participant Stripe
    participant WebhookHandler
    participant Database
    
    Student->>WebApp: Click "Betalen"
    WebApp->>EdgeFunc: POST /create-checkout
    EdgeFunc->>Database: Check enrollment exists
    Database-->>EdgeFunc: Enrollment details
    
    EdgeFunc->>Stripe: Create Checkout Session
    Stripe-->>EdgeFunc: Session URL + ID
    EdgeFunc->>Database: UPDATE enrollments (stripe_session_id)
    EdgeFunc-->>WebApp: Checkout URL
    
    WebApp->>Student: Redirect to Stripe
    Student->>Stripe: Enter payment details
    Stripe->>Stripe: Process payment
    
    alt Payment succeeds
        Stripe->>WebhookHandler: POST /webhook (checkout.session.completed)
        WebhookHandler->>WebhookHandler: Verify signature (HMAC)
        WebhookHandler->>Database: Query enrollments (stripe_session_id)
        Database-->>WebhookHandler: Enrollment found
        
        WebhookHandler->>Database: BEGIN TRANSACTION
        WebhookHandler->>Database: UPDATE enrollments (status: active)
        WebhookHandler->>Database: INSERT payments (amount, status: success)
        WebhookHandler->>Database: INSERT audit_log
        WebhookHandler->>Database: COMMIT
        
        WebhookHandler-->>Stripe: 200 OK
        Stripe->>Student: Redirect to success URL
        Student->>WebApp: View dashboard (enrollment active)
    else Payment fails
        Stripe->>WebhookHandler: POST /webhook (checkout.session.expired)
        WebhookHandler->>Database: UPDATE enrollments (status: failed)
        WebhookHandler->>Database: INSERT payments (status: failed)
        WebhookHandler-->>Stripe: 200 OK
        Stripe->>Student: Redirect to failure URL
        Student->>WebApp: "Payment failed, try again"
    end
```

**Webhook Security:**
1. Verify Stripe signature (HMAC-SHA256)
2. Check timestamp (reject if > 5min old)
3. Idempotency: Use event ID to prevent duplicates
4. Atomic updates: Use database transactions

---

## 7. Backup & Restore Process

```mermaid
sequenceDiagram
    participant GitHubAction
    participant SupabaseAPI
    participant Database
    participant S3Storage
    participant DevOpsTeam
    
    Note over GitHubAction: Daily at 03:00 UTC
    GitHubAction->>SupabaseAPI: Request pg_dump
    SupabaseAPI->>Database: pg_dump --format=custom
    Database-->>SupabaseAPI: Binary dump file
    SupabaseAPI-->>GitHubAction: Download dump
    
    GitHubAction->>GitHubAction: gzip compression
    GitHubAction->>GitHubAction: GPG encryption (AES256)
    GitHubAction->>S3Storage: Upload to artifacts
    S3Storage-->>GitHubAction: Artifact URL
    
    GitHubAction->>GitHubAction: Check retention (30 days)
    GitHubAction->>S3Storage: Delete old backups (> 30d)
    
    Note over DevOpsTeam: Restore scenario
    DevOpsTeam->>S3Storage: Download backup artifact
    S3Storage-->>DevOpsTeam: Encrypted dump
    DevOpsTeam->>DevOpsTeam: GPG decrypt
    DevOpsTeam->>DevOpsTeam: gunzip decompress
    
    DevOpsTeam->>Database: pg_restore to staging
    Database-->>DevOpsTeam: Restore complete
    DevOpsTeam->>Database: Run validation tests
    
    alt Tests pass
        DevOpsTeam->>DevOpsTeam: Approve for production
        DevOpsTeam->>Database: pg_restore to production
    else Tests fail
        DevOpsTeam->>DevOpsTeam: Investigate & fix
        DevOpsTeam->>Database: Rollback staging
    end
```

**Backup Metrics:**
- Average size: ~500MB compressed
- Encryption: GPG with 4096-bit RSA key
- Transfer time: ~2 minutes
- Retention: 30 days = 15GB total storage

---

## 8. Certificate Issuance

```mermaid
sequenceDiagram
    participant Student
    participant UI
    participant EdgeFunc
    participant Database
    participant PDFGenerator
    participant EmailService
    
    Note over Student: Completes all requirements
    Database->>Database: Trigger: niveau completion check
    Database->>Database: Check criteria met
    
    alt All criteria met
        Database->>EdgeFunc: Event: niveau_completed
        EdgeFunc->>Database: Query student + niveau details
        Database-->>EdgeFunc: Student profile + achievements
        
        EdgeFunc->>Database: SELECT certificate_template
        Database-->>EdgeFunc: Template design (JSON)
        
        EdgeFunc->>PDFGenerator: Generate certificate PDF
        PDFGenerator->>PDFGenerator: Populate template with data
        PDFGenerator->>PDFGenerator: Generate QR code (verification URL)
        PDFGenerator-->>EdgeFunc: PDF bytes
        
        EdgeFunc->>Database: INSERT issued_certificates
        EdgeFunc->>Database: Upload PDF to storage
        Database-->>EdgeFunc: Certificate ID
        
        EdgeFunc->>EmailService: Send certificate email
        EmailService->>Student: Email with PDF attachment
        
        EdgeFunc->>Database: INSERT notifications
        Database->>UI: Push notification
        UI->>Student: "Certificaat behaald! 🎓"
    else Criteria not met
        Database->>Database: Log: Incomplete requirements
    end
```

**Certificate Data:**
```json
{
  "certificate_id": "CERT-2025-001234",
  "student_name": "Ahmed Hassan",
  "niveau_name": "Niveau 3: Gemiddeld",
  "completion_date": "2025-11-25",
  "total_points": 1050,
  "average_score": 87.5,
  "teacher_signature": "Dr. Fatima Al-Zahra",
  "qr_code": "https://platform.com/verify/CERT-2025-001234",
  "signature_hash": "SHA256:abc123..."
}
```

---

## Performance Benchmarks

| Sequence | Avg Time | P95 | P99 | SLA |
|----------|----------|-----|-----|-----|
| Authentication | 250ms | 400ms | 600ms | <1s |
| Adaptive Recs | 500ms | 800ms | 1.2s | <2s |
| Forum Post | 300ms | 500ms | 800ms | <1s |
| Grading | 200ms | 350ms | 500ms | <1s |
| Chat Message | 80ms | 150ms | 250ms | <500ms |
| Payment Webhook | 400ms | 700ms | 1s | <2s |
| Backup | 10min | 12min | 15min | <20min |
| Certificate | 2s | 3s | 5s | <10s |

---

## Next Steps

- [Service Interactions](./04-service-interactions.md)
- [Edge Functions](./05-edge-functions.md)
- [Database Schema](./06-database-schema.md)

---

**Laatst bijgewerkt:** 25 november 2025
