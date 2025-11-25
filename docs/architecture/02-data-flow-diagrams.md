# 🔄 Data Flow Diagrams

## Overzicht

Deze sectie beschrijft de data flows binnen het Arabisch Leerplatform, van user input tot database persistence en terug.

---

## 1. Student Enrollment Flow

```mermaid
sequenceDiagram
    participant Student
    participant WebApp
    participant EdgeFunction
    participant Database
    participant StripeAPI
    
    Student->>WebApp: Selecteer module + niveau
    WebApp->>Student: Toon prijs & opties
    Student->>WebApp: Kies betaalmethode
    WebApp->>EdgeFunction: POST /create-enrollment
    EdgeFunction->>Database: Check module availability
    Database-->>EdgeFunction: Module details
    EdgeFunction->>StripeAPI: Create payment intent
    StripeAPI-->>EdgeFunction: Payment intent ID
    EdgeFunction->>Database: INSERT enrollments (status: pending)
    EdgeFunction-->>WebApp: Payment URL + enrollment_id
    WebApp->>Student: Redirect to payment
    Student->>StripeAPI: Complete payment
    StripeAPI->>EdgeFunction: Webhook: payment.succeeded
    EdgeFunction->>Database: UPDATE enrollments (status: active)
    EdgeFunction->>Database: INSERT audit_log
    EdgeFunction-->>StripeAPI: 200 OK
```

**Key Points:**
- Enrollment is created with `status: pending`
- Payment is handled by Stripe (external)
- Webhook updates enrollment to `active`
- All actions are logged in `audit_log`

---

## 2. Content Upload & Virus Scanning Flow

```mermaid
flowchart TD
    A[User uploads file] --> B{File size check}
    B -->|Too large| C[Reject: 10MB limit]
    B -->|OK| D{File type check}
    D -->|Invalid| E[Reject: Invalid type]
    D -->|Valid| F[Upload to Supabase Storage]
    F --> G[Create file_scans record]
    G --> H[Trigger edge function: scan-upload]
    H --> I{ClamAV available?}
    I -->|Yes| J[Scan with ClamAV daemon]
    I -->|No| K[Fallback: VirusTotal API]
    J --> L{Virus detected?}
    K --> L
    L -->|Yes| M[Quarantine file]
    L -->|No| N[Mark as clean]
    M --> O[UPDATE file_scans: infected=true]
    N --> P[UPDATE file_scans: scan_status=clean]
    O --> Q[Notify moderator]
    P --> R[File available for use]
    M --> S[DELETE from storage]
    
    style M fill:#ff6b6b
    style N fill:#51cf66
    style Q fill:#feca57
```

**Security Measures:**
1. **Size limit**: 10MB max
2. **Type whitelist**: Images, PDFs, Office docs
3. **Dual scanning**: ClamAV + VirusTotal
4. **Automatic quarantine**: Infected files are deleted
5. **Audit trail**: All scans logged to `file_scans` table

---

## 3. Real-time Chat Message Flow

```mermaid
sequenceDiagram
    participant UserA
    participant WebAppA
    participant Realtime
    participant Database
    participant WebAppB
    participant UserB
    
    UserA->>WebAppA: Type message
    WebAppA->>Database: INSERT messages
    Database->>Realtime: NOTIFY new message
    Realtime->>WebAppB: Push via WebSocket
    WebAppB->>UserB: Display message
    WebAppB->>Database: UPDATE message_reads
    Database->>Realtime: NOTIFY read receipt
    Realtime->>WebAppA: Push read receipt
    WebAppA->>UserA: Show "Gelezen" indicator
```

**Performance Optimizations:**
- **WebSocket persistence**: Reduce reconnection overhead
- **Message batching**: Group multiple messages in 100ms window
- **Presence tracking**: Show "typing..." indicator
- **Read receipts**: Track per-message read status

---

## 4. Adaptive Learning Recommendation Flow

```mermaid
flowchart TD
    A[Student completes exercise] --> B[Insert to practice_sessions]
    B --> C[Trigger: update_student_progress]
    C --> D[Update student_niveau_progress]
    D --> E[Insert to learning_analytics]
    E --> F[Calculate accuracy_rate]
    F --> G{Accuracy < 60%?}
    G -->|Yes| H[Identify weak_areas]
    G -->|No| I{Accuracy > 80%?}
    I -->|Yes| J[Identify strong_areas]
    I -->|No| K[Continue current path]
    H --> L[Query content_library for weak topics]
    L --> M[Recommend remedial exercises]
    J --> N[Query content_library for advanced topics]
    N --> O[Recommend enrichment content]
    K --> P[Recommend next level content]
    
    M --> Q[Return recommendations via API]
    O --> Q
    P --> Q
    Q --> R[Display to student]
    
    style H fill:#ff6b6b
    style J fill:#51cf66
    style K fill:#74c0fc
```

**Algorithm Logic:**
- **Weak areas** (<60% accuracy): Remedial exercises, video explanations
- **Strong areas** (>80% accuracy): Advanced challenges, bonus content
- **Average** (60-80%): Regular progression
- **Consistency check**: 3 consecutive weeks at level before advancement

---

## 5. Forum Post Moderation Flow

```mermaid
flowchart LR
    A[User creates post] --> B[INSERT forum_posts]
    B --> C[Trigger: profanity_check]
    C --> D{Contains profanity?}
    D -->|Yes| E[Auto-flag post]
    D -->|No| F[Publish post]
    E --> G[INSERT content_moderation]
    G --> H[Notify moderators]
    H --> I[Moderator reviews]
    I --> J{Decision}
    J -->|Approve| K[UPDATE: is_gerapporteerd=false]
    J -->|Delete| L[UPDATE: is_verwijderd=true]
    J -->|Warn user| M[INSERT user_warnings]
    K --> F
    L --> N[Hidden from feed]
    M --> O{Warning count >= 3?}
    O -->|Yes| P[INSERT ban_history]
    O -->|No| Q[User notified]
    P --> R[User banned (temp/permanent)]
    
    style E fill:#feca57
    style L fill:#ff6b6b
    style P fill:#c92a2a
```

**Moderation Triggers:**
1. **Profanity filter**: Keyword-based (Dutch, English, Arabic)
2. **Spam detection**: Duplicate content, excessive links
3. **User reports**: Manual flagging by community
4. **Automated patterns**: Multiple posts in short time

---

## 6. Progress Tracking & Badges Flow

```mermaid
flowchart TD
    A[Student earns points] --> B{Source?}
    B -->|Task submission| C[Grade awarded]
    B -->|Question answer| D[Points awarded]
    B -->|Bonus points| E[Teacher grants bonus]
    
    C --> F[SUM total_points for niveau]
    D --> F
    E --> F
    
    F --> G{Total >= threshold?}
    G -->|100 points| H[Award Bronze Badge]
    G -->|500 points| I[Award Silver Badge]
    G -->|1000 points| J[Award Gold Badge]
    
    H --> K[INSERT awarded_badges]
    I --> K
    J --> K
    
    K --> L[Trigger notification]
    L --> M[Push notification to student]
    
    G -->|1000 points + completion| N[Mark niveau as completed]
    N --> O[Generate certificate]
    O --> P[INSERT issued_certificates]
    P --> Q[Email certificate PDF]
    
    style H fill:#cd7f32
    style I fill:#c0c0c0
    style J fill:#ffd700
```

**Badge Thresholds:**
- **Bronze**: 100, 200, 300, 400 points
- **Silver**: 500, 600, 700, 800, 900 points
- **Gold**: 1000 points (niveau completion)
- **Special badges**: Consistency (3-week streak), Excellence (>90% avg)

---

## 7. Analytics Event Tracking Flow

```mermaid
sequenceDiagram
    participant Browser
    participant WebApp
    participant AnalyticsService
    participant Database
    participant BI_Dashboard
    
    Browser->>WebApp: User action (click, view, etc.)
    WebApp->>AnalyticsService: trackEvent(type, data)
    AnalyticsService->>AnalyticsService: Batch events (100ms)
    AnalyticsService->>Database: INSERT analytics_events[]
    
    Note over Database: Hourly aggregation job
    Database->>Database: Aggregate to materialized views
    
    BI_Dashboard->>Database: Query aggregated data
    Database-->>BI_Dashboard: Return metrics
    BI_Dashboard->>BI_Dashboard: Render charts (Recharts)
```

**Tracked Events:**
- **Page views**: URL, timestamp, session_id
- **User actions**: Clicks, form submissions, video plays
- **Performance**: Web Vitals (LCP, FID, CLS)
- **Errors**: Client-side errors, API failures
- **Engagement**: Time on page, scroll depth

**Aggregations:**
- **Hourly**: Basic metrics (views, users)
- **Daily**: Retention, engagement scores
- **Weekly**: Cohort analysis, churn prediction
- **Monthly**: Revenue, LTV, CAC

---

## 8. Backup & Restore Flow

```mermaid
flowchart TD
    A[GitHub Action: Daily 03:00 UTC] --> B[Trigger backup-database.yml]
    B --> C[pg_dump via Supabase API]
    C --> D[Compress with gzip]
    D --> E[Encrypt with GPG]
    E --> F[Upload to GitHub Artifacts]
    F --> G[Tag with timestamp]
    G --> H{Retention check}
    H -->|> 30 days| I[Delete old backups]
    H -->|<= 30 days| J[Keep backup]
    
    K[Restore needed] --> L[Download artifact]
    L --> M[Decrypt with GPG key]
    M --> N[Decompress gzip]
    N --> O[pg_restore to staging DB]
    O --> P[Run validation tests]
    P --> Q{Tests pass?}
    Q -->|Yes| R[Confirm restore]
    Q -->|No| S[Rollback & investigate]
    R --> T[Production restore (if needed)]
    
    style I fill:#feca57
    style S fill:#ff6b6b
    style R fill:#51cf66
```

**Backup Strategy:**
- **Frequency**: Daily at 03:00 UTC
- **Retention**: 30 days rolling window
- **Storage**: GitHub Artifacts (encrypted)
- **Size**: ~500MB compressed (estimated)
- **Testing**: Quarterly restore drills

---

## 9. Teacher Grading Workflow

```mermaid
sequenceDiagram
    participant Student
    participant WebApp
    participant Database
    participant Teacher
    participant NotificationService
    
    Student->>WebApp: Submit task
    WebApp->>Database: INSERT task_submissions (grade: null)
    Database->>Teacher: Notification: "New submission"
    Teacher->>WebApp: Open grading interface
    WebApp->>Database: Query task_submissions + rubric
    Database-->>WebApp: Return submissions
    Teacher->>WebApp: Assign grade + feedback
    WebApp->>Database: UPDATE task_submissions (grade, feedback)
    Database->>Database: Trigger: update_student_progress
    Database->>NotificationService: Grade assigned event
    NotificationService->>Student: Push notification
    Student->>WebApp: View grade + feedback
```

**Grading Features:**
- **Rubrics**: Pre-defined criteria with point values
- **Bulk grading**: Grade multiple submissions at once
- **Feedback templates**: Reusable comments
- **Grade distribution**: Analytics per class/level

---

## 10. Payment Processing Flow (Stripe)

```mermaid
flowchart TD
    A[Student initiates payment] --> B[Edge function: create-checkout]
    B --> C[Stripe: Create Checkout Session]
    C --> D[Redirect to Stripe Checkout]
    D --> E[Student completes payment]
    E --> F{Payment status?}
    F -->|Success| G[Stripe webhook: checkout.session.completed]
    F -->|Failed| H[Stripe webhook: checkout.session.expired]
    
    G --> I[Edge function: handle-webhook]
    I --> J[Verify webhook signature]
    J --> K{Valid?}
    K -->|No| L[Reject: 400 Bad Request]
    K -->|Yes| M[UPDATE enrollments: status=active]
    M --> N[INSERT payments record]
    N --> O[INSERT audit_log]
    O --> P[Send confirmation email]
    P --> Q[Redirect to dashboard]
    
    H --> R[INSERT payments: status=failed]
    R --> S[Notify student: payment failed]
    
    style G fill:#51cf66
    style H fill:#ff6b6b
    style L fill:#c92a2a
```

**Payment Types:**
- **One-time**: Full module price upfront
- **Installments**: Monthly payments (3-12 months)
- **Per-class**: Pay per enrolled class
- **Subscription**: Monthly access to all modules

---

## Data Flow Summary

| Flow | Latency | Throughput | Critical? |
|------|---------|------------|-----------|
| Enrollment | ~2-5s | Low (10/day) | High |
| File Upload | ~5-30s | Medium (100/day) | High |
| Chat Messages | <100ms | High (1k/hour) | Medium |
| Adaptive Recs | ~500ms | Medium (500/day) | Medium |
| Forum Moderation | ~2s | Low (50/day) | High |
| Progress Tracking | <200ms | High (5k/day) | Low |
| Analytics | Batch | Very High (100k/day) | Low |
| Backups | ~10min | Daily | High |
| Grading | ~1s | Low (50/day) | Medium |
| Payments | ~3-10s | Low (20/day) | Critical |

---

## Next Steps

- [Sequence Diagrams](./03-sequence-diagrams.md)
- [Service Interactions](./04-service-interactions.md)
- [Edge Functions](./05-edge-functions.md)

---

**Laatst bijgewerkt:** 25 november 2025
