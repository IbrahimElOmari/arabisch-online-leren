# Teacher Tools User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Teacher Dashboard](#teacher-dashboard)
4. [Managing Classes](#managing-classes)
5. [Working with Students](#working-with-students)
6. [Creating and Managing Notes](#creating-and-managing-notes)
7. [Awarding Rewards](#awarding-rewards)
8. [Assigning Tasks](#assigning-tasks)
9. [Viewing Student Progress](#viewing-student-progress)
10. [Language Support & Accessibility](#language-support--accessibility)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the Teacher Tools feature of the Arabic Learning Platform! This guide will help you understand and effectively use all the tools available to manage your classes, track student progress, and engage with your students.

**Who is this guide for?**
- Teachers (role: `leerkracht`) who want to manage their classes and students
- Administrators (role: `admin`) who need to oversee all teacher activities

**What can you do with Teacher Tools?**
- View an overview of all your classes and student statistics
- Manage class rosters and student information
- Create private notes about individual students
- Award experience points (XP), badges, and coins to motivate students
- Assign homework and track submissions
- Monitor individual and class-wide progress

---

## Getting Started

### Accessing the Teacher Dashboard

**Step 1: Log in to your account**
1. Navigate to the login page at `/auth`
2. Enter your email and password
3. Click "Sign In"

**Step 2: Navigate to the Teacher Dashboard**

After logging in, you have two ways to access the Teacher Dashboard:

**Option A: Via the Navigation Menu**
1. Click on your profile icon in the top-right corner
2. Select "Teacher Dashboard" from the dropdown menu

**Option B: Direct URL**
- Go directly to `/teacher` or `/teacher/dashboard` in your browser

**What you'll see:**
Upon first access, you'll see the main Teacher Dashboard with:
- Overview statistics (total classes, students, pending tasks, rewards given)
- A list of all your classes
- Quick action buttons

---

## Teacher Dashboard

The Teacher Dashboard is your central hub for all teaching activities.

### Dashboard Layout

**Top Section: Statistics Cards**

Four key metrics are displayed at the top:

1. **Total Classes** - Number of classes you're teaching
2. **Total Students** - Total number of students across all your classes
3. **Pending Tasks** - Number of tasks awaiting grading
4. **Rewards Given** - Total rewards you've awarded this month

These numbers update automatically as you interact with the system.

**Middle Section: My Classes**

This section lists all classes you're teaching. Each class card shows:
- Class name
- Brief description
- Number of enrolled students
- Number of levels in the class

**Actions Available:**
- Click on any class card to view detailed class information
- Click "+ New Class" button (top right) to create a new class (if enabled)

### Understanding the Statistics

**Total Classes:**
- Includes only active classes assigned to you
- Archived or deleted classes are not counted

**Total Students:**
- Sum of all enrolled students across your classes
- Only counts students with "paid" enrollment status
- Duplicate students (enrolled in multiple of your classes) are counted once per enrollment

**Pending Tasks:**
- Tasks that have been submitted but not yet graded
- Updates in real-time as you grade submissions

**Rewards Given:**
- Manual rewards (XP, badges, coins) awarded by you
- Resets monthly for this display (full history is preserved)

---

## Managing Classes

### Viewing Class Details

**Step 1: Click on a class**
From the Teacher Dashboard, click on any class card to open the Class Details page.

**Step 2: Explore the tabs**
The Class Details page has four tabs:

1. **Students** - View and manage your student roster
2. **Tasks** - Create and manage assignments
3. **Progress** - View class-wide and individual progress
4. **Rewards** - Award and view rewards history

### Students Tab

**What you see:**
- A list of all students enrolled in the class
- Each student row shows:
  - Student name
  - Email address
  - Enrollment status (Active/Pending)
  - Action buttons (View, Note, Edit, Remove)

**Available Actions:**

**Add a Student:**
1. Click the "+ Add Student" button (top right)
2. Enter the student's email or select from available students
3. Click "Add" to enroll them in the class

**Remove a Student:**
1. Click the "Remove" button next to the student's name
2. Confirm the removal in the dialog
3. The student will be removed from the class roster (their data is preserved)

**View Student Details:**
1. Click on a student's name or the "View" button
2. You'll see their profile, progress, and submission history

---

## Working with Students

### Student Information

When you click on a student, you can view:
- Full name and contact information
- Enrollment date and status
- Current level and progress
- Recent activity and submissions
- Your private notes about this student
- Rewards they've received

### Communicating with Students

**Sending Messages:**
1. From the student detail view, click "Send Message"
2. Type your message in the dialog
3. Click "Send"
4. The student will receive a notification and can reply

**Best Practices:**
- Use messages for quick questions or feedback
- For detailed feedback, use the notes feature (see below)
- Keep messages professional and constructive

---

## Creating and Managing Notes

Notes are private observations visible only to you (and administrators). They're perfect for tracking student behavior, progress observations, or concerns.

### Creating a Note

**Step 1: Navigate to the student**
- Go to Class Details > Students tab
- Click on the student you want to add a note for
- OR click the "Add Note" button next to their name

**Step 2: Write the note**
1. Click "+ Add Note" button
2. A dialog will appear with a text area
3. Enter your note content (e.g., "Student shows great improvement in pronunciation but needs more practice with verb conjugation")
4. (Optional) Check the "Flag" box if this note requires special attention
5. Click "Save"

**Note Content Guidelines:**
- Be specific and constructive
- Include dates when referring to specific events
- Focus on observable behaviors and performance
- Avoid overly negative language; frame challenges as opportunities

### Viewing Notes

**To see all notes for a student:**
1. Click on the student's name from the class roster
2. Scroll to the "Notes" section
3. All your notes for this student are displayed in chronological order (newest first)

**Note Display:**
- Each note shows its content, creation date, and last updated time
- Flagged notes have a special indicator (e.g., a flag icon or different background color)

### Editing a Note

**Step 1: Locate the note**
- Go to the student's detail page > Notes section

**Step 2: Edit**
1. Click the "Edit" button (pencil icon) next to the note
2. Modify the content in the dialog
3. Change the flagged status if needed
4. Click "Save"

**Note:** The "updated_at" timestamp will reflect when you last edited the note.

### Deleting a Note

**Step 1: Locate the note**
- Go to the student's detail page > Notes section

**Step 2: Delete**
1. Click the "Delete" button (trash icon) next to the note
2. Confirm the deletion in the confirmation dialog
3. The note is permanently removed

**Warning:** Deletion is irreversible. If you think you might need the information later, consider editing the note to mark it as "Resolved" instead of deleting it.

### Flagging Notes

**What does flagging do?**
- Flagged notes appear at the top of the notes list
- They have a visual indicator (e.g., red flag, highlighted background)
- Use flags for notes that require follow-up or are particularly important

**Use cases for flagging:**
- Student showing signs of struggling (needs intervention)
- Behavioral concern that needs monitoring
- Parent meeting required
- Student excelling (potential for advanced placement)

---

## Awarding Rewards

Teachers can manually award rewards to students to recognize achievements, good behavior, or outstanding work.

### Types of Rewards

**1. Experience Points (XP)**
- General points that accumulate over time
- Students can see their total XP on their dashboard
- Typically awarded in increments of 10-100 points

**2. Badges**
- Visual achievements for specific accomplishments
- More prestigious than XP
- Displayed on student profiles

**3. Coins** (if enabled)
- In-system currency for gamification
- Can be used for unlocking content or features

### How to Award a Reward

**Step 1: Navigate to the reward interface**

**Option A: From Class Details**
1. Go to Class Details > Rewards tab
2. Click "Award Reward" button
3. Select the student from the dropdown

**Option B: From Student View**
1. Click on a student from the class roster
2. In the student detail view, click "Award Reward" button

**Step 2: Fill out the reward form**
1. **Select Reward Type** - Choose XP, Badge, or Coins
2. **Enter Amount** - Specify the amount (e.g., 50 XP)
3. **Provide Reason** - Write a brief explanation (required, min 5 characters)
   - Example: "Excellent homework submission on time"
   - Example: "Outstanding participation in class discussion"
4. Click "Award" button

**Step 3: Confirmation**
- You'll see a success message
- The reward is immediately visible to the student
- It's logged in the student's reward history

### Reward Guidelines

**When to award rewards:**
- ✅ Completion of challenging tasks
- ✅ Consistent effort and improvement
- ✅ Helping classmates
- ✅ Perfect attendance
- ✅ Exceptional assignments

**How much to award:**
- Small rewards (10-25 XP): Regular good work
- Medium rewards (50-75 XP): Excellent performance
- Large rewards (100+ XP): Outstanding achievements
- Badges: Reserve for major milestones

**Best Practices:**
- Be consistent across students (fairness)
- Explain why they're receiving the reward
- Don't overuse rewards (they lose meaning)
- Balance automatic and manual rewards

### Viewing Reward History

**To see all rewards you've given:**
1. Go to Class Details > Rewards tab
2. You'll see a list of all rewards awarded in this class
3. Filter by student, date, or reward type (if available)

**To see rewards a specific student received:**
1. Click on the student's name
2. Scroll to "Rewards History" section
3. You'll see all rewards (from all teachers) this student has received

---

## Assigning Tasks

Tasks are assignments, homework, quizzes, or any work you want students to complete.

### Creating a Task

**Step 1: Navigate to the Tasks tab**
1. Go to Class Details > Tasks tab
2. Click "+ Create Task" button

**Step 2: Fill out the task form**

**Required Fields:**
1. **Title** (e.g., "Arabic Grammar Exercise 3")
2. **Level** - Select which level/class this task is for
3. **Submission Type:**
   - Text (students type their answer)
   - File upload (students upload a document/image)
   - Both (text and file)
4. **Grading Scale** - Maximum points (e.g., 10, 100)

**Optional Fields:**
5. **Description** - Detailed instructions for the task
6. **Due Date** - When the task should be completed by (date and time)
7. **Attachments** - Upload reference materials, instructions, or examples

**Step 3: Review and assign**
1. Preview your task
2. Click "Assign Task"
3. Students in the selected level are immediately notified

### Managing Tasks

**Viewing Submitted Tasks:**
1. Go to Class Details > Tasks tab
2. Click on a task name
3. You'll see a list of all students and their submission status:
   - ✅ Submitted - Ready for grading
   - ⏳ Pending - Not yet submitted
   - ⏰ Late - Submitted after due date
   - ❌ Missing - Past due date, not submitted

**Grading a Submission:**
1. Click "View Submission" next to a student's name
2. Review their work (text answer or uploaded file)
3. Enter a grade (0 to max points)
4. (Optional) Add written feedback
5. Click "Submit Grade"
6. The student receives a notification with their grade and feedback

**Editing a Task:**
1. Go to the task detail view
2. Click "Edit Task" button
3. Modify any fields (title, description, due date, etc.)
4. Click "Save Changes"
5. Students are notified of the update if the due date changes

**Deleting a Task:**
1. Go to the task detail view
2. Click "Delete Task" button
3. Confirm deletion
4. **Warning:** This permanently removes the task and all submissions. Consider archiving instead if you want to preserve data.

---

## Viewing Student Progress

### Individual Student Progress

**Step 1: Access student profile**
1. From Class Details > Students tab, click on a student's name

**Step 2: Review progress metrics**

You'll see:
- **Overall Progress** - Percentage of level completed
- **XP Earned** - Total experience points
- **Badges Earned** - Collection of badges
- **Completed Tasks** - Number of tasks finished vs. total
- **Average Grade** - Across all graded assignments
- **Last Activity** - When they last interacted with the platform

**Step 3: Drill down**
- Click on specific tasks to see their submissions and grades
- View timeline of activity (submissions, notes, rewards)

### Class-Wide Progress

**Step 1: Go to Progress tab**
1. Class Details > Progress tab

**Step 2: View aggregate statistics**

You'll see:
- **Class Average Grade**
- **Completion Rate** - Percentage of assigned tasks completed
- **Engagement Score** - Based on login frequency and activity
- **Top Performers** - Leaderboard of highest-scoring students
- **Students Needing Attention** - Those falling behind or not engaging

**Step 3: Export or filter**
- Use date filters to see progress over specific time periods
- Export data to CSV for further analysis (if available)

**Use Cases:**
- Identify which topics need re-teaching (if many students struggle)
- Recognize high achievers for additional challenges
- Intervene early with struggling students
- Report progress to administrators or parents

---

## Language Support & Accessibility

### Multi-Language Interface

The Teacher Dashboard supports three languages:
1. **Dutch (Nederlands)** - Default
2. **English** - For international teachers
3. **Arabic (العربية)** - With full RTL (right-to-left) support

**Changing Language:**
1. Click on the language selector (flag icon or dropdown) in the navigation bar
2. Select your preferred language
3. The entire interface updates immediately
4. Your preference is saved for future sessions

**RTL Support (Arabic):**
- When Arabic is selected, the layout flips to right-to-left
- Navigation, buttons, and text all align correctly
- All content is fully translated, including UI elements

### Accessibility Features

**Keyboard Navigation:**
- Use `Tab` to move between interactive elements
- Use `Enter` or `Space` to activate buttons
- Use `Escape` to close dialogs

**Screen Reader Support:**
- All interactive elements have proper ARIA labels
- Form fields have associated labels
- Status messages are announced to screen readers

**High Contrast Mode:**
- Supports system-level dark mode and high contrast settings
- Toggle between light and dark theme in settings

**Font Size:**
- Interface respects browser zoom settings
- All text scales proportionally

---

## Troubleshooting

### Common Issues & Solutions

**Issue: "I can't see the Teacher Dashboard option"**

**Solution:**
- Ensure your account has the `leerkracht` (teacher) role
- Log out and log back in to refresh your session
- Contact an administrator to verify your role assignment

---

**Issue: "My class list is empty but I know I have classes"**

**Solution:**
- Check if you're logged in with the correct account
- Verify that your classes are marked as "active" in the system
- Contact support if classes were recently assigned to you (they may take a few minutes to appear)

---

**Issue: "I can't create a note for a student"**

**Solution:**
- Ensure the student is enrolled in one of your classes
- Check that you're not trying to add a note for a student in another teacher's class
- Verify you have network connectivity (notes are saved to the server)
- If the error persists, check the browser console for error messages

---

**Issue: "Reward button is disabled or grayed out"**

**Solution:**
- Ensure the student is active (not removed or archived)
- Check that you've filled in all required fields (amount, reason)
- Verify the amount is greater than 0
- Make sure you have permission to award rewards in this class

---

**Issue: "Task submissions aren't showing up"**

**Solution:**
- Refresh the page (students may have just submitted)
- Check if the task is assigned to the correct level
- Verify the task isn't set to "draft" mode (unpublished)
- Confirm students have submitted (ask them directly if needed)

---

**Issue: "Student progress shows 0% but they've completed work"**

**Solution:**
- Progress updates may take a few minutes to recalculate
- Check if tasks have been graded (ungraded tasks don't count toward progress)
- Verify the student's work is in the correct class/level
- Manually trigger a progress recalculation (if that option exists) or contact support

---

**Issue: "I deleted something by accident"**

**Solution:**
- **Notes, Tasks, Rewards:** Some deletions may be irreversible. Check if there's an "Archive" or "Undo" option.
- **Student Removal:** Re-enroll the student from the class roster.
- **For critical data loss:** Contact an administrator immediately; they may be able to restore from backups (depending on system configuration).

---

**Issue: "The interface is in the wrong language"**

**Solution:**
- Use the language selector (top navigation bar) to change language
- If the selector isn't visible, check your browser's language settings (the app may auto-detect)
- Clear your browser cache and reload the page
- If using Arabic, ensure your browser supports RTL layouts

---

**Issue: "Page is loading slowly or timing out"**

**Solution:**
- Check your internet connection
- Try refreshing the page (Ctrl+R or Cmd+R)
- Close unnecessary browser tabs
- If the issue persists, the server may be experiencing high load; try again in a few minutes
- Report persistent performance issues to IT support

---

### Getting Help

**Documentation:**
- Main project README: `/README.md`
- API documentation: `/docs/PR10-API-DOCUMENTATION.md`
- For developers: Source code and comments in `/src/pages/` and `/src/services/`

**Support Channels:**
- Email: support@arabischonlineleren.nl
- In-app help: Click the "?" icon in the navigation bar
- Administrator: Contact your system administrator for account or permission issues

**Reporting Bugs:**
If you encounter a bug or error:
1. Note the steps that led to the issue
2. Take a screenshot (if applicable)
3. Check the browser console for error messages (F12 → Console tab)
4. Report to support with the above information

---

## Tips for Effective Use

### Daily Routine

**Morning Check (5 minutes):**
1. Log in and view your Teacher Dashboard
2. Check "Pending Tasks" stat - any new submissions to grade?
3. Glance at your classes for today's schedule

**After Class (10 minutes):**
1. Add notes for any students who stood out (good or concerning)
2. Award rewards for excellent performance during class
3. Answer any student messages

**Weekly Review (30 minutes):**
1. Review Progress tab for each class
2. Identify students who need extra help
3. Plan next week's tasks and assignments

### Best Practices

**1. Be consistent:**
- Grade submissions within 48 hours
- Respond to messages promptly
- Apply the same standards to all students

**2. Use notes effectively:**
- Write notes immediately after observations (while fresh)
- Be specific (not "good work" but "excelled in pronunciation drill on Monday")
- Review notes before parent meetings or report cards

**3. Motivate with rewards:**
- Reward effort, not just achievement
- Celebrate improvement, even if not perfect
- Use badges for milestones, XP for regular achievements

**4. Keep students informed:**
- Announce tasks well in advance of due dates
- Provide clear grading rubrics
- Give constructive feedback on submissions

**5. Monitor progress regularly:**
- Don't wait for report cards to check student progress
- Intervene early if you notice a downward trend
- Celebrate improvements publicly (if appropriate)

---

## Conclusion

Congratulations! You're now equipped to use all the Teacher Tools features effectively. Remember:

- **Teacher Dashboard** is your home base
- **Notes** are for your private observations
- **Rewards** motivate and recognize students
- **Tasks** structure the learning experience
- **Progress** helps you track and intervene

The more you use these tools, the more efficient and effective you'll become at managing your classes and supporting your students' learning journey.

**Happy Teaching! 🎓**

---

*User Guide Version: 1.0*  
*Last Updated: November 16, 2025*  
*For: PR10 - Teacher Tools & Class Management*
