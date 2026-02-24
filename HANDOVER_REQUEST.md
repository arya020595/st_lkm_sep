# LKM SEP v2 — System Handover Information Request

> **Prepared by:** Arya Rifqi Pratama
> **Date:** 24 February 2026

Dear Vendor,

We are preparing to take over the **LKM SEP v2** system. Please complete every section below.

For sensitive information (passwords, keys), please use a secure channel (password manager, encrypted file, or in-person handover).

---

## 1. System Overview

- System name:
- Purpose of the system:
- Main business functions:
- List of modules/features:
- Current system version:
- Development status (active development or maintenance mode):

---

## 2. High-Level Architecture

- Architecture diagram:
- Technology stack (backend, frontend, database, framework):
- Architecture type (monolith / microservices):
- External integrations and dependencies:

---

## 3. Infrastructure & Server Information

> The server is already on the client side. No server migration needed. Please provide access details below.

- Server ownership (vendor / client / third party):
- Cloud / hosting provider:
- Cloud provider account access (URL, email, password):

### Server List

| #   | Role (App / DB / Staging / Prod) | IP Address | OS  | SSH Port | SSH Username | SSH Key or Password |
| --- | -------------------------------- | ---------- | --- | -------- | ------------ | ------------------- |
| 1   |                                  |            |     |          |              |                     |
| 2   |                                  |            |     |          |              |                     |
| 3   |                                  |            |     |          |              |                     |

### SSH / VPN Access

- Is VPN required? If yes, provide VPN client, config, and credentials:
- SSH access method (key-based or password):
- Please attach SSH keys if applicable:

### Step-by-step: How to access the server

```
Step 1:
Step 2:
Step 3:
```

---

## 4. Deployment Process

- Deployment steps (step-by-step):
- Manual or automated deployment:
- CI/CD tools used (if any):
- Rollback procedure:

### Step-by-step: How to deploy to production

```
Step 1:
Step 2:
Step 3:
```

### Rollback procedure

```
Step 1:
Step 2:
```

---

## 5. Source Code

- Repository URL:
- Repository platform (GitHub / GitLab / etc.):
- Access permissions (who has access):
- Branching strategy:
- Production branch:
- Other related repositories (if any):
- **Repository ownership**: Should the repository be transferred to LKM's GitHub/GitLab organization, or will LKM access it from the vendor's account? If transfer, please initiate it. If staying on vendor account, please add LKM team as collaborators with admin access.

---

## 6. Database

- Database type:
- Database server information (host, port):
- Database name:
- Database credentials (username, password):
- ERD diagram:
- Migration process (how do you apply database schema changes when deploying a new version? e.g., manual scripts, auto-migration, no migration needed):

---

## 7. Environment Configuration

- Production environment variables (provide complete `.env` with actual values):
- Staging environment variables (if staging exists):
- Local development setup guide:
- System requirements (Node version, etc.):

---

## 8. Integration & External Services

| #   | Service Name | Purpose | Credentials / API Keys |
| --- | ------------ | ------- | ---------------------- |
| 1   |              |         |                        |
| 2   |              |         |                        |
| 3   |              |         |                        |

- API documentation for each integration:

---

## 9. Background Jobs & Scheduler

- Cron jobs (list all):
- Background workers:
- Management process (how to monitor/restart):

---

## 10. User & Access Management

- User roles:
- Admin access (credentials):
- Permission structure:

---

## 11. Logging & Monitoring

- Log locations:
- Monitoring tools:
- Error tracking tools:

---

## 12. Backup & Recovery

- Backup availability:
- Backup frequency:
- Backup location:
- Recovery procedure:

---

## 13. Documentation

- Technical documentation:
- User manuals:
- API documentation:

---

## 14. Known Issues & Technical Debt

- Known bugs:
- System limitations:
- Technical constraints:

---

## 15. Ownership Transfer

### Handover Preparation

- Proposed handover date:
- Is the system currently stable and running in production?
- Are there any ongoing or unfinished development tasks? If yes, what is the status?
- Are there any open pull requests or pending deployments we should be aware of before taking over?
- Will the vendor conduct a live walkthrough of the system (architecture, codebase, infrastructure)?
- Will the vendor conduct a live walkthrough of the deployment process on the actual server?
- How many knowledge transfer sessions are planned? Please propose a schedule:
- Who from the vendor side will be present during the handover?
- What needs to be done by the vendor before the handover is considered complete? (checklist)

### Post-Handover

- Post-handover support period (how long):
- Support scope (bug fixes only / feature development / consultation):
- Vendor involvement after handover (none / on-call / scheduled):
- How to reach the vendor during the support period (contact, response time):

---

## 16. Contact Person

- Technical contact person:
- Email:
- Phone number:

---

## 17. Domain & DNS

- Domain name:
- DNS provider access (URL, email, password):

---

## 18. SSL Certificate

- SSL provider:
- Expiry date:
- Renewal process:

---

## 19. Secrets & Keys

- API keys:
- Encryption keys:
- Private keys:

---

## Sign-Off

|                   | Name               | Signature | Date |
| ----------------- | ------------------ | --------- | ---- |
| **Vendor**        |                    |           |      |
| **Internal Team** | Arya Rifqi Pratama |           |      |

---

_Please return this document fully completed by **[DEADLINE]**._
