# Job Search Tracker

A structured approach to job research, portfolio building, resume management, and interview preparation.

## Quick Start

### 1. Track Applications
Open `docs/leads/applications.csv` and add each job application:
- Date applied
- Company
- Role
- Status (Applied → Phone Screen → Interview → Offer/Rejected)
- Contact person
- Follow-up date

### 2. Research Companies
Create a new file in `docs/leads/` for each company you research:
- Company mission & culture
- Tech stack
- Hiring timeline
- Key contacts (recruiters, hiring managers)
- Role requirements & compensation range

### 3. Manage Resume
- `docs/resume/resume-master.md` — Your single source of truth
- Create `docs/resume/resume-tailored-[company].md` for each application
- Tailor bullets to match the job description

### 4. Build Portfolio
- Document your best 3-5 projects
- Create a case study in `docs/portfolio/case-studies/` for each
- Include: problem, solution, tech stack, results/metrics

### 5. Prepare for Interviews
- Update `docs/interview/story.md` with your narrative
- Add FAQs to `docs/interview/faqs.md`
- Keep a list of questions to ask in `docs/interview/questions.md`

---

## Folder Structure

```
docs/
├── leads/                    # Job research & tracking
│   ├── applications.csv      # Track all applications here
│   ├── company-1.md          # Research for specific companies
│   └── company-2.md
├── resume/
│   ├── resume-master.md      # Master version (single source of truth)
│   └── resume-tailored-*.md  # Customized for specific roles
├── portfolio/
│   ├── projects.md           # List of your best work
│   └── case-studies/         # Deep dives on each project
│       ├── project-1.md
│       └── project-2.md
└── interview/
    ├── story.md              # Your background & narrative
    ├── faqs.md               # Common questions & your answers
    └── questions.md          # Questions to ask interviewers
```

---

## Next Steps

1. **Add your first application** → `docs/leads/applications.csv`
2. **Research a target company** → Create `docs/leads/company-[name].md`
3. **Draft your master resume** → `docs/resume/resume-master.md`
4. **Document a portfolio project** → `docs/portfolio/case-studies/project-1.md`

---

## Tips

- **Keep it organized**: One file per company, one file per project
- **Update regularly**: Add notes after every interview or application
- **Use the templates**: They're in CLAUDE.md (this repo's guidelines)
- **Commit often**: Track your progress in git

For detailed guidance, see [CLAUDE.md](./CLAUDE.md).
