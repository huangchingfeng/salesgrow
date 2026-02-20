# SalesGrow Compliance Guide

This document outlines the regulatory requirements for each market SalesGrow operates in and provides implementation guidance for engineering teams.

---

## 1. Applicable Regulations by Market

| Region | Regulation | Full Name | Key Requirements |
|--------|-----------|-----------|------------------|
| EU/EEA | GDPR | General Data Protection Regulation | Consent, data minimization, right to erasure, 72h breach notification, DPO |
| Germany | DSGVO + BDSG | Bundesdatenschutzgesetz | GDPR + stricter employee data rules, DPO mandatory at 20+ employees |
| France | GDPR + Loi Informatique | Loi n 78-17 | GDPR + CNIL oversight, stricter cookie consent |
| US (California) | CCPA/CPRA | California Consumer Privacy Act | Right to know, delete, opt-out of sale, non-discrimination |
| Japan | APPI | Act on Protection of Personal Information | Purpose limitation, third-party transfer restrictions, cross-border transfer rules |
| South Korea | PIPA | Personal Information Protection Act | Consent-based collection, data localization preferences, mandatory DPO |
| Thailand | PDPA | Personal Data Protection Act | Consent requirement, data subject rights, data breach notification |
| Vietnam | PDPD | Personal Data Protection Decree (Decree 13/2023) | Consent, data localization for certain data, impact assessments |
| Spain/LatAm | GDPR / LGPD variants | Various | GDPR for Spain, varying requirements across Latin America |

---

## 2. Technical Implementation Requirements

### 2.1 Consent Management

```
Priority: HIGH
Status: Required before launch in EU, KR, TH, VN
```

- [ ] Cookie consent banner with granular controls (essential, analytics, functional)
- [ ] Consent logging with timestamps and version tracking
- [ ] Pre-checked boxes are NOT allowed (GDPR Art. 7)
- [ ] Consent withdrawal must be as easy as giving consent
- [ ] Age verification gate (16+ for GDPR, varies by country)
- [ ] Separate consent for marketing communications
- [ ] Double opt-in for email marketing (recommended for Germany)

### 2.2 Data Subject Rights (DSR) API

```
Priority: HIGH
Status: Required for GDPR, CCPA, APPI, PIPA compliance
```

- [ ] **GET /api/user/data-export** — Export all user data in JSON/CSV format
  - Must include: account data, usage logs, AI interaction history, client data
  - Response time: within 30 days (GDPR), 45 days (CCPA)
- [ ] **DELETE /api/user/account** — Complete account and data deletion
  - Must cascade to all related records
  - Must notify sub-processors to delete data
  - Retain only legally required records (payment history)
- [ ] **PUT /api/user/data-rectification** — Allow users to correct their data
- [ ] **POST /api/user/processing-restriction** — Restrict data processing
- [ ] **POST /api/user/data-portability** — Transfer data to another service

### 2.3 Data Encryption

```
Priority: HIGH
Status: Required
```

- [ ] TLS 1.3 for all data in transit
- [ ] AES-256 encryption for data at rest
- [ ] Encrypt database backups
- [ ] Key rotation every 90 days
- [ ] PII fields encrypted at application level (email, name, phone)

### 2.4 Data Retention & Deletion

```
Priority: HIGH
Status: Required
```

Implement automated data lifecycle management:

| Data Type | Retention | Auto-Delete | Legal Basis |
|-----------|-----------|-------------|-------------|
| Account data | Until deletion | On account delete | Contract |
| Usage logs | 12 months | Rolling delete | Legitimate interest |
| Payment records | 7 years (US/EU), 5 years (KR), 10 years (DE) | After period expires | Legal obligation |
| AI interaction logs | 90 days | Rolling delete | Legitimate interest |
| Support tickets | 24 months | After period expires | Legitimate interest |
| Marketing consent logs | Duration of consent + 3 years | After withdrawal + period | Legal obligation |

### 2.5 Cross-Border Data Transfer

```
Priority: MEDIUM
Status: Required for international operations
```

- [ ] Standard Contractual Clauses (SCCs) with all sub-processors
- [ ] Transfer Impact Assessments (TIA) for high-risk transfers
- [ ] Data Processing Agreements (DPA) with cloud providers and AI providers
- [ ] Document all cross-border data flows
- [ ] Consider data residency options for Japan and South Korea

### 2.6 Breach Notification System

```
Priority: HIGH
Status: Required
```

- [ ] Incident detection and classification system
- [ ] 72-hour notification to supervisory authority (GDPR Art. 33)
- [ ] User notification for high-risk breaches (GDPR Art. 34)
- [ ] Breach register with documentation of all incidents
- [ ] APPI: Report to PPC and notify affected individuals
- [ ] PIPA: Report to PIPC within 72 hours

---

## 3. AI-Specific Compliance

### 3.1 AI Transparency

- [ ] Clearly disclose that content is AI-generated
- [ ] Provide opt-out from AI data processing where required
- [ ] Do not use customer data to train models without explicit consent
- [ ] Log all AI interactions for audit purposes (retain 90 days)
- [ ] Include AI disclaimer in Terms of Service

### 3.2 AI Data Processing

- [ ] Minimize data sent to AI providers (strip PII when possible)
- [ ] Use API agreements that prevent model training on user data
- [ ] Document data flows to AI providers in privacy policy
- [ ] Implement content moderation for AI outputs
- [ ] EU AI Act compliance assessment (when applicable)

---

## 4. Country-Specific Requirements

### 4.1 Japan (APPI)

- [ ] Clearly specify purpose of use at collection time
- [ ] Obtain consent before providing personal data to third parties
- [ ] Implement "opt-in" consent for cross-border transfers
- [ ] Appoint a personal information protection manager
- [ ] Register with PPC if handling sensitive personal information
- [ ] Display privacy policy in Japanese

### 4.2 South Korea (PIPA)

- [ ] Obtain affirmative consent with clear, specific purpose
- [ ] Separate consent for optional information collection
- [ ] Appoint a Chief Privacy Officer (CPO)
- [ ] Conduct Privacy Impact Assessment for large-scale processing
- [ ] Provide privacy policy in Korean
- [ ] Implement data localization measures as recommended
- [ ] Report breaches to PIPC within 72 hours

### 4.3 Thailand (PDPA)

- [ ] Obtain consent before collecting personal data
- [ ] Provide privacy notice in Thai
- [ ] Appoint a Data Protection Officer if processing large volumes
- [ ] Implement data subject access request handling
- [ ] Notify PDPC of breaches within 72 hours

### 4.4 Vietnam (PDPD - Decree 13/2023)

- [ ] Register data processing with Ministry of Public Security for cross-border transfers
- [ ] Conduct Data Protection Impact Assessment
- [ ] Appoint a data protection contact person
- [ ] Store certain data locally (if required by sector-specific regulations)
- [ ] Provide privacy notice in Vietnamese

### 4.5 Germany (DSGVO + BDSG)

- [ ] Mandatory DPO appointment (20+ employees processing personal data)
- [ ] Double opt-in for email marketing
- [ ] Strict cookie consent (ePrivacy)
- [ ] Extended record retention (10 years for financial records per HGB/AO)
- [ ] Works council consultation for employee data processing

---

## 5. Compliance Checklist

### Pre-Launch Checklist

- [ ] Privacy policies published in all supported languages (EN, JA, KO, DE)
- [ ] Terms of Service published
- [ ] Cookie consent banner implemented with granular controls
- [ ] Data export functionality working
- [ ] Account deletion functionality working (cascade delete)
- [ ] Encryption at rest and in transit verified
- [ ] AI data processing agreements in place
- [ ] Sub-processor list documented and published
- [ ] Breach notification procedures documented
- [ ] DPO/CPO appointed and contact published

### Ongoing Compliance

- [ ] Quarterly privacy policy review
- [ ] Annual Data Protection Impact Assessment
- [ ] Monthly security vulnerability scans
- [ ] Annual penetration testing
- [ ] Sub-processor audit (annually)
- [ ] Employee data protection training (annually)
- [ ] Consent records audit (quarterly)
- [ ] Data retention policy enforcement verification (monthly)

---

## 6. Sub-Processors

| Provider | Purpose | Location | DPA Status |
|----------|---------|----------|------------|
| Vercel | Hosting | US/Global | Required |
| Neon/PostgreSQL | Database | US | Required |
| OpenAI | AI processing | US | Required |
| Google AI | AI processing | US | Required |
| Stripe | Payment processing | US/Global | Required |
| Resend | Email delivery | US | Required |
| Vercel Analytics | Usage analytics | US | Required |

---

## 7. Contact

**Data Protection Officer**: dpo@salesgrow.app
**Privacy Inquiries**: privacy@salesgrow.app
**Security Issues**: security@salesgrow.app

---

*This document is maintained by the SalesGrow engineering and legal teams and should be reviewed quarterly.*
