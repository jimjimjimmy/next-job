# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Repository Purpose**: Job research, planning, portfolio, resume, and career development hub.

---

## Quick Reference: Job Search Workflows

### 1. Job Research & Lead Tracking
**Goal**: Research companies, roles, and collect leads in an organized way.

```bash
# Research a company/job
# - Gather info: company mission, tech stack, team, culture
# - Find contacts (recruiters, hiring managers)
# - Note role requirements and compensation range
# - Save to: docs/leads/ or research/ folder

# Track applications
# - Company name, role, date applied, contact person, status
# - Interview stage, follow-up dates, notes
```

**Data to capture**:
- Company name, industry, size
- Role title, level (junior/mid/senior)
- Key requirements vs. your skills (match %)
- Compensation range (if available)
- Recruiter/hiring manager name & email
- Application status: Applied → Phone screen → Interview → Offer / Rejected
- Follow-up dates & notes

### 2. Resume & Portfolio
**Goal**: Maintain an up-to-date resume and showcase your best work.

```bash
# Resume
# - Keep a master version (single source of truth)
# - Tailor for different roles (copy, customize bullets)
# - Update achievements/metrics after each project or win

# Portfolio
# - Document your best projects with writeups
# - Include: problem, solution, tech stack, results/metrics
# - Link to repos, deployed apps, or case studies
# - Keep descriptions concise and impact-focused
```

**Key principles**:
- Lead with **quantified results** (built X, improved performance by Y%, reduced costs by Z%)
- **Action verbs**: Built, launched, optimized, reduced, increased, designed
- **Tailor to the job**: Reorder bullets to highlight most relevant experience
- **Show, don't tell**: Link to live projects, code, case studies

### 3. Interview Prep
**Goal**: Prepare for phone screens, technical interviews, and conversations.

```bash
# Before each interview:
# - Review the job description again
# - Research the interviewer (LinkedIn, GitHub, etc.)
# - Prepare 2-3 questions about the role/company
# - Mock interview: practice your story, technical explanations
# - Review your portfolio projects (be ready to explain them)

# After each interview:
# - Write down what went well and what to improve
# - Note any technical questions you stumbled on
# - Send thank-you email within 24 hours
```

### 4. Career Planning
**Goal**: Set goals, track progress, and reflect on your career direction.

```bash
# Career reflection
# - What type of role/company excites you?
# - What skills do you want to develop?
# - What's your target salary range?
# - Timeline: when do you want to land a role?

# Skill gaps
# - Identify missing skills for target roles
# - Plan learning: courses, projects, practice
# - Track progress
```

---

## Folder Structure (Suggested)

```
next-job/
├── docs/
│   ├── leads/                    # Job leads & research
│   │   ├── company-research.md   # Company info, contacts, insights
│   │   └── applications.csv      # Track: date applied, status, follow-up
│   ├── resume/
│   │   ├── resume-master.md      # Single source of truth
│   │   └── resume-tailored-*.md  # Role-specific versions
│   ├── portfolio/
│   │   ├── projects.md           # List of showcase projects
│   │   └── case-studies/         # Detailed writeups (1 per project)
│   └── interview/
│       ├── story.md              # Your narrative (background → goals)
│       ├── faqs.md               # Common questions & answers
│       └── questions-to-ask.md   # Questions for interviewers
├── CLAUDE.md                     # This file
└── README.md                     # Overview & how to use this repo
```

---

## Context Rules for Future Claude Sessions

### Memory Anchors (Job Search Edition)
- **Before updating resume**: Check what metrics/impact you can quantify from recent projects
- **Before tailoring for a role**: Review the job description again—highlight alignment with your skills
- **Before research deep-dive**: Define the goal: Are you researching company culture? Tech stack? Hiring timeline?

### Regression Shields
- **Do NOT apply to jobs** that don't align with your goals (spray-and-pray wastes energy)
- **Do NOT send generic cover letters**—tailor each one to the specific role
- **Do NOT update your resume** without keeping a master version (never lose your achievements)
- **Do NOT interview-prep** for only technical questions—practice your story and culture fit too

### Execution Discipline
- **Keep applications organized**: Track every application (date, status, follow-ups)
- **Follow up strategically**: 1 week after applying (if no response), then 1 week before deadline
- **Measure your effort**: Track conversion rates (applications → interviews → offers)
- **Iterate on your story**: After each rejection or feedback, refine how you present yourself

---

## Development Workflow (For This Repo)

1. **Research a company/role**: Create a new doc in `docs/leads/`, gather info, note key insights
2. **Track applications**: Update `applications.csv` with date, status, contact person
3. **Tailor your resume**: Copy from master, customize for the role, save as `resume-tailored-[company].md`
4. **Prep for interviews**: Update `docs/interview/faqs.md` and `story.md` with new talking points
5. **Reflect post-interview**: Document what went well, what to improve, send thank-you
6. **Commit & push**: Keep your research and planning in version control (backup + history)

---

## Important Notes

- **Always tailor, never spray**: Personalize resume/cover letter for each role—quality > quantity
- **Quantify impact**: "Built feature" → "Built feature used by 10k+ users, improved engagement by 25%"
- **Follow up strategically**: Set calendar reminders for follow-ups (1 week, then 1 week before deadline)
- **Track metrics**: Applications sent, interview rate, offer rate—identify where to improve
- **Keep master versions**: Resume, portfolio writeups—maintain one source of truth
- **Network alongside applications**: Reach out to people at target companies (often > job boards)

---

## Quality Gates

**Before sending an application**:
- [ ] Resume is tailored to the role (not generic)
- [ ] Cover letter is personalized (not templated)
- [ ] You've researched the company (culture, mission, tech stack)
- [ ] You've identified 1-2 people to reach out to (recruiter, hiring manager, current employee)

**Before an interview**:
- [ ] You've researched the interviewer (LinkedIn, GitHub)
- [ ] You've reviewed the job description (key requirements)
- [ ] You can tell your story in 2-3 minutes
- [ ] You can explain 2-3 of your best projects in detail
- [ ] You have 2-3 thoughtful questions prepared

**After an interview**:
- [ ] You sent a thank-you email within 24 hours
- [ ] You documented what went well and what to improve
- [ ] You identified any skills/topics to practice more
- [ ] You updated your application status & notes

---

## Context Rules for Future Claude Sessions

### Memory Anchors
- **Before modifying any function**: Locate its references globally to prevent unintended side effects.
- **Before refactoring**: Check if the code is tested and what tests cover it.
- **Before merging changes**: Verify that related code in other files is compatible.

### Regression Shields
- **Do NOT remove error handling** unless explicitly ordered and you've verified it's truly redundant.
- **Do NOT strip validation checks** from data boundaries (user input, API responses, file I/O).
- **Do NOT delete tests** even if they seem outdated—they may be catching real edge cases.
- **Do NOT refactor existing working code** without running the full test suite first.

### Execution Discipline
- Prioritize architectural consistency over code brevity.
- Favor explicit error messages over silent failures.
- Keep changes focused and minimal—if a PR touches unrelated functionality, split it.
- Always run tests locally before pushing to avoid CI failures.

---

## Development Workflow

1. **Understand the task**: Ask clarifying questions before coding.
2. **Check existing tests**: Understand what behavior is already covered.
3. **Make minimal, focused changes**: One feature or bug fix per commit.
4. **Run tests locally**: Never push breaking changes.
5. **Commit with clear messages**: Include attribution (`Co-Authored-By: Claude Haiku 4.5`).
6. **Push to the development branch**: Typically `claude/[branch-name]` as specified in the session.

---

## Important Notes

- **[TODO: Add any project-specific gotchas, third-party integrations, or critical constraints]**
- Example: "Database schema changes require a migration script in `db/migrations/`"
- Example: "API endpoints are authenticated via JWT tokens in the `Authorization` header"
- Example: "This project uses feature flags in `config/features.yml`—always check before adding new functionality"

---

## Testing & Quality Gates

**Test Coverage Expectations**:
- [TODO: Specify minimum coverage percentage or which code MUST be tested]

**CI/CD Pipeline**:
- [TODO: List what runs on push (tests, linting, builds, deployments)]

**Code Review Checklist** (for PRs):
- [ ] Tests pass locally and in CI
- [ ] Linting passes (or auto-fix was applied)
- [ ] No unintended side effects or regressions
- [ ] Commit messages are clear
