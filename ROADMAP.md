# Dooz PM Suite Roadmap 🗺️

> **Current Version:** 1.0  
> **Last Updated:** 2026-02-24

---

## Current Status

Dooz PM Suite is a project management system built on the intent-based decision framework. It provides project tracking through intents, decisions, and knowledge graphs.

### Completed Features ✅

- **Intent Management** — Create, track, and transition work intents
- **Decision Ledger** — Append-only decision log with options
- **Knowledge Graph** — Visual representation of intent relationships
- **Proposal Review** — AI-assisted proposal evaluation queue
- **Web UI** — React-based interface with real-time updates
- **REST API** — Full CRUD operations for all entities

**Tech Stack:** Bun, Hono, Drizzle ORM, SQLite/PostgreSQL, React

---

## Q1 2025 (Jan-Mar): Foundation Completion

### Theme: Core Project Management

#### Milestones
- [ ] **PMS-001:** Task management system
- [ ] **PMS-002:** Risk tracking and mitigation
- [ ] **PMS-003:** Team assignments and permissions
- [ ] **PMS-004:** Calendar integration (Google/Outlook)

#### Features

**Task Management:**
- [ ] Task creation and assignment
- [ ] Task status tracking (todo, in-progress, done)
- [ ] Task dependencies and blocking
- [ ] Subtask support
- [ ] Time estimates and tracking

**Risk Management:**
- [ ] Risk identification forms
- [ ] Risk severity/priority scoring
- [ ] Mitigation strategy tracking
- [ ] Risk dashboard with heat map
- [ ] Automated risk alerts

**Team Collaboration:**
- [ ] Team member assignment
- [ ] Role-based permissions
- [ ] Activity feed
- [ ] @mentions and notifications
- [ ] Comment threads on intents

**Integrations:**
- [ ] Google Calendar sync
- [ ] Outlook Calendar sync
- [ ] Due date reminders
- [ ] Recurring intent support

---

## Q2 2025 (Apr-Jun): Agile Planning

### Theme: Sprint Management & Metrics

#### Milestones
- [ ] **PMS-005:** Sprint planning interface
- [ ] **PMS-006:** Burndown charts and velocity
- [ ] **PMS-007:** Time tracking integration

#### Features

**Sprint Planning:**
- [ ] Sprint creation and configuration
- [ ] Intent estimation (story points)
- [ ] Sprint capacity planning
- [ ] Sprint backlog management
- [ ] Sprint review/retrospective templates

**Metrics & Reporting:**
- [ ] Velocity tracking
- [ ] Burndown/burnup charts
- [ ] Cumulative flow diagrams
- [ ] Cycle time analysis
- [ ] Team performance dashboards

**Time Tracking:**
- [ ] Timer for intents/tasks
- [ ] Manual time entry
- [ ] Time reports by intent/project
- [ ] Integration with dooz-worklog
- [ ] Billable hours tracking

**Advanced Views:**
- [ ] Kanban board view
- [ ] Gantt chart timeline
- [ ] List view with filtering
- [ ] Custom dashboard widgets

---

## Q3 2025 (Jul-Sep): AI-Powered Insights

### Theme: Intelligence & Automation

#### Milestones
- [ ] **PMS-008:** AI intent prioritization
- [ ] **PMS-009:** Predictive analytics
- [ ] **PMS-010:** Multi-project portfolios

#### Features

**AI Intent Management:**
- [ ] Automatic intent categorization
- [ ] Priority recommendations
- [ ] Resource allocation suggestions
- [ ] Deadline risk prediction
- [ ] Smart task breakdown

**Predictive Analytics:**
- [ ] Sprint completion forecasting
- [ ] Resource bottleneck prediction
- [ ] Risk probability scoring
- [ ] Team velocity trends
- [ ] Scope creep detection

**Portfolio Management:**
- [ ] Multi-project dashboard
- [ ] Cross-project dependencies
- [ ] Resource allocation across projects
- [ ] Portfolio-level reporting
- [ ] Strategic alignment tracking

**Automation:**
- [ ] Intent auto-creation from emails
- [ ] Automated status transitions
- [ ] Notification rules engine
- [ ] Integration webhooks

---

## Q4 2025 (Oct-Dec): Enterprise Features

### Theme: Scale & Advanced Collaboration

#### Milestones
- [ ] **PMS-011:** Workflow customization
- [ ] **PMS-012:** Advanced permissions
- [ ] **PMS-013:** External integrations

#### Features

**Custom Workflows:**
- [ ] Visual workflow builder
- [ ] Custom intent states
- [ ] Transition rules and conditions
- [ ] Approval workflows
- [ ] Automated actions on transitions

**Advanced Permissions:**
- [ ] Field-level permissions
- [ ] Intent-type permissions
- [ ] Time-based access
- [ ] Guest access management
- [ ] Audit logging

**External Integrations:**
- [ ] GitHub issues sync
- [ ] Jira migration/import
- [ ] Slack notifications
- [ ] Microsoft Teams integration
- [ ] Email-to-intent creation

**Reporting:**
- [ ] Custom report builder
- [ ] Scheduled reports
- [ ] Export to various formats
- [ ] API access for external BI tools

---

## Long Term Vision

### AI-Native Project Management
- AI project manager assistant
- Automatic meeting transcription to intents
- Voice-controlled intent creation
- Natural language queries

### Ecosystem Integration
- Deep dooz-brain integration for context
- dooz-hindsight for decision analytics
- dooz-sync for offline capability

### Advanced Visualization
- 3D knowledge graph exploration
- VR project room
- AR intent visualization

### Predictive Project Management
- Automatic timeline adjustment
- Resource reallocation suggestions
- Risk auto-mitigation

---

## Dependencies

**Depends On:**
- dooz-core — Tenant and auth APIs
- dooz-bridge — Event publishing
- dooz-brain — Knowledge context

**Blocks:**
- dooz-hindsight — Waiting for decision data

---

## Technical Debt

- [ ] Add comprehensive API tests
- [ ] Optimize graph queries for large datasets
- [ ] Implement proper caching layer
- [ ] Add database connection pooling
- [ ] Improve error handling

---

## Notes

- Focus on stability in Q1 before adding AI features
- Calendar integration is high priority for user adoption
- AI features require dooz-ai-router integration
- Mobile app consideration for Q3/Q4

---

**Maintainer:** DoozieSoft PM Team  
**Status:** Active Development  
**License:** MIT
