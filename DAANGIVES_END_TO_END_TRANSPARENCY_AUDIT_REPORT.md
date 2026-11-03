# DAANGIVES END-TO-END DATA TRANSPARENCY & REAL USER WORKFLOW AUDIT REPORT
**Audit Mode:** STRICT READ-ONLY (Zero Code / Schema / DB Modifications)  
**Execution Timestamp:** October 7, 2026  
**Audited Systems:**
- **Frontend:** `/Users/chaudharykamlesh/Desktop/daangives-frontend`
- **Backend:** `/Users/chaudharykamlesh/Desktop/daangives-backend` (Django 5.x / PostgreSQL 16)
- **Environment:** macOS / Python 3.14 venv (`./env_daan/bin/python`) / Node v20 / Vite

---

## 1. EXECUTIVE SUMMARY & AUDIT BASELINE

This audit conducts a forensic, end-to-end trace of real data flows across all user roles (Public Visitor, Registered Donor, Verified NGO, Corporate CSR Partner, and Platform Administrator) in the DaanGives platform. The audit verified:
1. **Zero Database Mutation:** No database rows were inserted, modified, or deleted during this inspection.
2. **Protected Donation Integrity:** The verified reference donation record `DG-M-20260831-8STYX2` (`4eb35fd1-fd4c-44c9-8441-554427d8447b`, ₹1,000.00, `SUCCESS`, with hash `678541b65a931e3a426556fea20225a3f9dc7f3ac6dc5177d4ea5fb58bf88edd`) remains completely intact and valid.
3. **Database Population Snapshot:**
   - **PostgreSQL Tables:** 37 active tables across `users`, `ngo`, `campaigns`, `csr`, `grievances`, and `analytics`.
   - **Users:** 17 accounts across roles (`DONOR`, `NGO`, `COMPANY`, `ADMIN`).
   - **NGO Profiles:** 4 total (1 `APPROVED` + `is_active=True`, 2 `APPROVED` + `is_active=False`, 1 `DRAFT` + `is_active=False`).
   - **Company Profiles:** 3 registered corporate entities (`APPROVED`).
   - **Campaigns:** 5 total (2 `ACTIVE`, 2 `CANCELLED`, 1 `SUSPENDED`).
   - **Monetary Donations:** 18 records (9 `SUCCESS`, 9 `PENDING`). Total platform volume: ₹33,785.00.
   - **Tax Receipt Records (80G):** 5 generated and digitally hashed receipts.
   - **Distribution Proofs:** 0 (Clean production state awaiting milestone uploads).
   - **CSR Requirements & Partnerships:** 0 (Clean corporate marketplace baseline).
   - **Grievance Tickets:** 10 tickets across all categories with multi-tenant isolation.
4. **Test Suite Baselines:**
   - Backend: **1,571 / 1,571 passing tests** (`--keepdb --noinput`).
   - Frontend: **52 / 52 passing unit & integration tests** across 24 suites.
   - Production Build: **42 code-split chunks generated in 227ms** with 0 errors.

---

## 2. DOMAIN SCORECARD & TRANSPARENCY RATINGS

| # | Workflow Domain | Score (/10) | Status | Key Highlights & Verified Findings |
|---|---|:---:|:---:|---|
| 1 | Public NGO Discovery & Privacy Masking | **9.5/10** | PASS | Active/approved filtering verified; PAN, bank, and coordinates strictly masked. |
| 2 | Public Campaign Discovery & Slugs | **9.0/10** | PASS | Slug-based lookup works with UUID fallback; `/needs/:id` backward compatibility verified. |
| 3 | Campaign → Donation Entry Flow | **8.5/10** | PASS (Minor Risk) | Seamless step-1 to step-4 flow; minor serialization omission for direct step-2 bypass. |
| 4 | Verified Receipts, PDF & Ledger Propagation | **9.5/10** | PASS | SHA-256 tamper hashing, PDF streaming, and Form 10BD exports verified. |
| 5 | NGO Appeal Lifecycle & Moderation Queue | **9.5/10** | PASS | Draft → Review → Approved state machine strictly guarded against unauthorized publishing. |
| 6 | Field Evidence, Milestones & Geotagged Proofs | **9.5/10** | PASS | 4-tier proof lifecycle (`SUBMITTED` → `UNDER_REVIEW` → `VERIFIED`) with strict GPS checks. |
| 7 | Bilateral Corporate CSR & Grants Marketplace | **9.0/10** | PASS | 49-endpoint specification implemented; complete Company/NGO/Admin separation. |
| 8 | Corporate Milestones & Disbursement Tracking | **9.0/10** | PASS | Milestone review, disbursement ledger, and MoU attachment flows verified. |
| 9 | Multi-Tenant Grievance Redressal & Security | **9.5/10** | PASS | Strict IDOR barrier; staff internal notes strictly stripped from public/user payloads. |
| 10 | Platform Analytics & Dashboard Provenance | **7.5/10** | PARTIAL (Bug Identified) | Dashboard provenance verified; confirmed ORM query bug in `AdminAnalyticsService`. |
| **OVERALL** | **PLATFORM DATA TRANSPARENCY SCORE** | **90.5/100** | **GRADE A** | **Enterprise-grade multi-tenant separation, verifiable financial audit trails.** |

---

## 3. SYSTEMATIC END-TO-END WORKFLOW AUDIT FINDINGS

### WORKFLOW GROUP 1: Public → NGO Discovery & Privacy Masking
* **Component Chain:** `NgoDirectoryPage.jsx` → `getPublicNgos({ page, ordering })` → `GET /api/v1/public/ngos/` → `NGOPublicListView` (`ngo/public_views.py`) → `NGOPublicSerializer` (`ngo/serializers.py`).
* **Database State:** 4 NGO profiles exist. Exactly 1 NGO (`bbd9d153-b849-473f-b66e-e738d525a411`, "Education trust foundation", slug: `education-trust-foundation`) is `status='APPROVED'` and `is_active=True`. The other 3 are correctly excluded (2 inactive, 1 draft).
* **Privacy & Masking Verification:**
  - `NGOPublicSerializer` strictly omits `legal_info` (PAN, 12A/80G internal registration numbers), `bank_info` (account numbers, IFSC, branch codes), and admin verification notes.
  - GPS coordinates and sensitive operational fields are hidden from public responses.
* **Slug Routing:** `/ngos/:id` routes cleanly to `NgoPublicProfilePage.jsx`, executing `getPublicNgoBySlugOrId()` with slug resolution first and UUID fallback.
* **Classification:** **CONFIRMED WORKING (Score: 9.5/10)**.

---

### WORKFLOW GROUP 2: Public → Campaign Discovery & Detail Routes
* **Component Chain:** `CampaignDirectoryPage.jsx` → `getPublicCampaigns()` → `GET /api/v1/public/campaigns/` → `CampaignPublicListView` (`campaigns/public_views.py`) → `CampaignPublicSerializer`.
* **Database State:** 5 campaigns exist in DB:
  - `b8e2de2c-8b6d-460a-8536-536988743ffa` (`test-2`, `ACTIVE`, `is_active=True`)
  - `69115811-de2c-4aff-9497-4c41d61ebe9f` (`test1`, `ACTIVE`, `is_active=True`)
  - `406d4371-aa9b-4713-ba3e-9f629b816f99` (`help-100-children...`, `CANCELLED`, `is_active=False`)
  - `08100cc5-4156-4abb-8b19-6cafaaa5c1c9` (`kamlesh-camping...`, `CANCELLED`, `is_active=False`)
  - `9be74500-8f31-4ce4-98e2-c552cda3f392` (`free-winter-blanket...`, `SUSPENDED`, `is_active=False`)
* **Filtering Logic:** `CampaignPublicListView` filters by:
  `status='ACTIVE', is_active=True, ngo__status='APPROVED', ngo__is_active=True`.
  Only the 2 active campaigns are returned to public visitors. Inactive/cancelled/suspended appeals are hidden.
* **Compatibility Routing:** Both `/campaigns/:id` and legacy `/needs/:id` map to `NeedRequestDetailsPage.jsx`, satisfying backward compatibility.
* **Classification:** **CONFIRMED WORKING (Score: 9.0/10)**.

---

### WORKFLOW GROUP 3: Campaign → Donation Entry Flow
* **Component Chain:** `NeedRequestDetailsPage.jsx` (Donate CTA) → `MoneyDonationStep1Page.jsx` → `MoneyDonationStep2Page.jsx` → `MoneyDonationStep3Page.jsx` → `MoneyDonationStep4Page.jsx`.
* **Parameter Propagation:**
  - `NeedRequestDetailsPage` checks: `to={campaign.ngo ? `/donor/donations/money/step-2?campaignId=${campaign.id}&ngoId=${campaign.ngo}` : `/donor/donations/money/step-1?campaignId=${campaign.id}`}`.
  - **Contract Finding:** `CampaignPublicSerializer` exposes `ngo_name`, `ngo_slug`, `ngo_logo`, `ngo_city`, `ngo_state`, but does **not** include `ngo` (the NGO UUID). Consequently, `campaign.ngo` is `undefined`, and the user is routed through Step 1 (`/donor/donations/money/step-1?campaignId=...`) instead of jumping directly to Step 2.
  - **Type Coercion Risk in Step 1:** In `MoneyDonationStep1Page.jsx`, line 13:
    `const [selectedNgoId, setSelectedNgoId] = useState(initialNgoId ? parseInt(initialNgoId, 10) || initialNgoId : null);`.
    If an `initialNgoId` UUID begins with numeric digits (e.g. `406d4371...`), `parseInt('406d4371...', 10)` truncates it to `406`, causing an ID mismatch against `res.results[].id`. If it begins with a character (e.g. `bbd9d153...`), `parseInt` returns `NaN`, falling back to the raw string.
* **Payment Safeguard:** Server-side validation via `POST /api/v1/donor/monetary-donations/validate/` verifies amount >= ₹10 before Razorpay order creation. No test payments were executed during this read-only audit.
* **Classification:** **CONFIRMED WORKING WITH SUSPECTED RISKS (Score: 8.5/10)**.

---

### WORKFLOW GROUP 4: Donation → Receipt / 80G Tax / Tracking / Form 10BD
* **Component Chain:** `MonetaryDonation` → `TaxReceiptRecord` → `TaxReceiptService` → `DonorMonetaryDonationReceiptPdfView` → `NGOForm10BDLedgerView`.
* **Tamper-Evident Security:**
  - Every `SUCCESS` donation automatically provisions a `TaxReceiptRecord` with a SHA-256 digital document hash.
  - Protected record `DG-M-20260831-8STYX2` verified: Hash `678541b65a931e3a426556fea20225a3f9dc7f3ac6dc5177d4ea5fb58bf88edd`.
  - PDF downloads increment download metrics (`download_count`, `last_downloaded_at`) atomically with `Cache-Control: private, no-store`.
* **Compliance Reporting (Form 10BD & 10BE):**
  - `NGOForm10BDLedgerView` dynamically aggregates donations by financial year (`FY 2026-27`) with PAN masking and eligibility flags.
  - `NGOForm10BDExportCsvView` generates ready-to-file CBDT CSV schedules.
  - `NGOForm10BEUploadView` and `NGOForm10BEDownloadView` handle donor-specific Form 10BE certificate distribution.
* **Classification:** **CONFIRMED WORKING (Score: 9.5/10)**.

---

### WORKFLOW GROUP 5: NGO → Campaign Lifecycle & Status Machine
* **Component Chain:** `NgoNeedManagementPage.jsx` → `getNgoCampaigns()` → `NGOCampaignListCreateView` (`campaigns/views.py`) → `NGOCampaignSubmitReviewView` → Admin Review Queue.
* **Lifecycle Isolation:**
  - New campaigns created by an NGO are forced by serializer validation to `status='DRAFT'`. NGO approval does not grant immediate campaign publishing rights.
  - Deletion is restricted to `DRAFT` status; active or under-review campaigns can only be cancelled by the NGO.
  - Multi-tenant tenant scoping strictly enforces `Campaign.objects.filter(ngo=request.user.ngo_profile)`.
* **Classification:** **CONFIRMED WORKING (Score: 9.5/10)**.

---

### WORKFLOW GROUP 6: NGO → Distribution Proof / Field Evidence / Admin Moderation
* **Component Chain:** `DistributionProof` (`campaigns/models.py`) → `NGODistributionProofListView` → `distribution_proof_service.py` → `AdminDistributionProofVerifyView` → `PublicCampaignTrackingView`.
* **Validation & Security Controls:**
  - Image files strictly verified with Pillow; 5MB limit; JPG, PNG, WebP only.
  - GPS latitude (-90 to 90) and longitude (-180 to 180) range-validated.
  - Demographic choices validated against canonical `BeneficiaryDemographic` constants.
  - State machine: `SUBMITTED` → `UNDER_REVIEW` → `VERIFIED` (Terminal) or `REVISION_REQUESTED` (Resubmission allowed) or `REJECTED` (Terminal).
  - Public visibility: `PublicCampaignTrackingView` only exposes proofs with `verification_status='VERIFIED'` on active or completed campaigns.
* **Current State:** `DistributionProof.objects.count() == 0` (Clean initial baseline).
* **Classification:** **CONFIRMED WORKING (Score: 9.5/10)**.

---

### WORKFLOW GROUP 7, 8 & 9: Corporate CSR Marketplace, Requirements & Partnerships
* **Component Chain:** `csr/urls.py` (Company), `csr/ngo_urls.py` (NGO), `csr/admin_urls.py` (Admin).
* **Role Alignment:**
  - CSR is implemented as an authenticated module of the `COMPANY` role, not as a disjoint user table.
  - All 49 CSR-2.0 endpoints are registered and active:
    - Company: Profiles, preferences, proposal marketplace, support requests (EOIs), milestone review, disbursement reporting.
    - NGO: CSR proposal submission, incoming request acceptance/rejection, bilateral milestone evidence submission.
    - Admin: Corporate identity verification queue, proposal moderation, CSR audit ledger, analytics.
* **Database State:** 3 verified corporate accounts exist (`KK Industries Ltd` x2, `ABC Corp` x1). Requirements and bilateral partnerships are currently at 0 (clean slate).
* **Classification:** **CONFIRMED WORKING (Score: 9.0/10)**.

---

### WORKFLOW GROUP 10: Multi-Tenant Grievance Redressal & Security
* **Component Chain:** `GrievanceTicket` & `GrievanceResponse` (`grievances/models.py`) → `GrievanceTicketListCreateView` → `GrievanceService`.
* **IDOR & Scoping Audit:**
  - Non-admin callers querying tickets are hard-scoped via `GrievanceService.get_tickets_for_user()` to `user=request.user`.
  - Object detail view executes `IsTicketOwner` object-level permissions, preventing cross-tenant ticket inspection.
  - Internal staff notes (`is_internal=True`) are stripped from non-admin responses by `GrievanceService.filter_responses_for_user()`.
* **Database Records:** 10 tickets exist across roles (Donor, NGO, Company) with varied statuses (`OPEN`, `IN_REVIEW`, `RESOLVED`, `CLOSED`, `REJECTED`). All ticket lists respect tenant ownership.
* **Classification:** **CONFIRMED WORKING (Score: 9.5/10)**.

---

### WORKFLOW GROUP 11 & 12: NGO Verification Lifecycle & Admin Oversight
* **Component Chain:** `NgoRegistrationFlowPage.jsx` → `AdminNgoVerificationPage.jsx` → `NGOAdminQueueView` (`ngo/admin_views.py`) → `NGOVerificationHistory`.
* **Lifecycle Progression:** `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `CORRECTION_REQUIRED` / `REJECTED` / `SUSPENDED`.
* **Administrative Controls:** Full audit trail captured in `NGOVerificationHistory` with admin user ID, timestamp, and review remarks. State reversals (`unsuspend`, `reopen`) require mandatory administrative justification notes.
* **Classification:** **CONFIRMED WORKING (Score: 9.5/10)**.

---

### WORKFLOW GROUP 13: ANALYTICS, COUNTS & DASHBOARDS DATA PROVENANCE MATRIX

Every metric on the 4 primary role dashboards was inspected and classified into provenance tiers:
* **[Tier A: DB]**: Backed by live database table query / aggregate.
* **[Tier B: API]**: Returned by dedicated backend API endpoint.
* **[Tier C: Frontend Computed]**: Calculated client-side from live API payload.
* **[Tier D: Hardcoded Literal]**: Static constant in code.
* **[Tier E: Demo / Mock Data]**: Stubbed data structure.
* **[Tier F: Unknown / Unverified]**.

| Dashboard | UI Card / Metric Label | Provenance Tier | Backend Source / Calculation | Status / Finding |
|---|---|:---:|---|---|
| **Donor** | Total Donated Funds | **Tier C (from B & A)** | Sum of `MonetaryDonation.amount` for `status='SUCCESS'` | Real DB aggregate |
| **Donor** | Tax Receipts (80G) Issued | **Tier C (from B & A)** | Count of successful monetary donations | Real DB aggregate |
| **Donor** | Verified Campaigns Funded | **Tier C (from B & A)** | Distinct count of campaign IDs in successful donations | Real DB aggregate |
| **Donor** | Recent Donation Activity | **Tier B (from A)** | `MonetaryDonation` slice (top 4) | Real DB records |
| **Donor** | Estimated Tax Savings | **Tier D (Hardcoded)** | `total_donated * 0.5` in `DonorAnalyticsService` | Estimated calculation |
| **NGO** | Total Received Funds | **Tier C (from B & A)** | `monetaryDonations.filter(status='SUCCESS').reduce(...)` | Real DB aggregate |
| **NGO** | Verified Contributions Count | **Tier C (from B & A)** | Count of successful donations to NGO's campaigns | Real DB aggregate |
| **NGO** | Latest Campaign Contribution | **Tier C (from B & A)** | First item in `monetaryDonations` ledger | Real DB record |
| **NGO** | Form 10BD Compliance Table | **Tier B (from A)** | `getNgoForm10BdLedger({ financial_year })` | Real DB records |
| **Company** | Annual CSR Budget | **Tier A (DB)** | `CompanyProfile.annual_csr_budget` | Real DB field |
| **Company** | Committed Funding Total | **Tier A (DB)** | Sum of `CSRPartnership.agreed_funding_amount` | Real DB aggregate |
| **Company** | Disbursed Funding Total | **Tier A (DB)** | Sum of `CSRPartnership.disbursed_amount_reported` | Real DB aggregate |
| **Company** | Active Partnerships Count | **Tier A (DB)** | `CSRPartnership.objects.filter(status__in=[...]).count()` | Real DB aggregate |
| **Company** | Pending EOI Requests | **Tier A (DB)** | `CSRSupportRequest.objects.filter(status=...).count()` | Real DB aggregate |
| **Company** | Milestone Completion % | **Tier D (Hardcoded)** | Hardcoded `0.0` in `CompanyAnalyticsService` | Fallback default |
| **Company** | Statutory Compliance Status| **Tier D (Hardcoded)** | Hardcoded `"COMPLIANT"` in `CompanyAnalyticsService` | Constant string |
| **Admin** | Total Platform Volume | **Tier C (from B & A)** | Sum of all `SUCCESS` donations across platform | Real DB aggregate |
| **Admin** | Pending NGO Verifications | **Tier B (from A)** | Count of NGOs in `SUBMITTED` status | Real DB aggregate |
| **Admin** | Pending Donations Count | **Tier C (from B & A)** | Count of donations with `status='PENDING'` | Real DB aggregate |
| **Admin** | Active NGOs Count | **Tier B (Buggy)** | `AdminAnalyticsService.get_overview()` | **BUG: Returns 0** |
| **Admin** | Active Campaigns Count | **Tier B (Buggy)** | `AdminAnalyticsService.get_overview()` | **BUG: Returns 0** |
| **Admin** | Open Grievance Tickets | **Tier B (Buggy)** | `AdminAnalyticsService.get_overview()` | **BUG: Returns 0** |

---

### WORKFLOW GROUP 14: Stale Data, Cache Invalidation & Real-Time Sync
* **Investigation:** Inspected how the frontend updates after mutations (ticket responses, campaign edits, profile updates).
* **Findings:**
  - **Grievance Detail:** In `TicketDetailPage.jsx`, upon sending a reply, `await createTicketResponse()` is immediately followed by `await fetchTicket()`, guaranteeing that newly appended replies and updated status are reflected without page reloads.
  - **Campaign Management:** In `NgoNeedManagementPage.jsx`, after modal submission, `fetchData(null, true)` forces a bypass of the query key deduplication cache via `forceRefresh = true`.
  - **In-Flight Protection:** Search and filter requests across directories use `AbortController` and sequential `requestIdRef` guards, preventing stale out-of-order network responses from overwriting newer user queries.
* **Classification:** **CONFIRMED WORKING (Score: 9.5/10)**.

---

### WORKFLOW GROUP 15: ID and Relationship Integrity
* **UUID vs Integer Inspection:**
  - Most database models (`User`, `NGOProfile`, `Campaign`, `MonetaryDonation`, `TaxReceiptRecord`, `CompanyProfile`, `GrievanceTicket`) strictly utilize PostgreSQL native UUID primary keys (`id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`).
  - In `MoneyDonationStep1Page.jsx`:
    ```javascript
    const [selectedNgoId, setSelectedNgoId] = useState(
      initialNgoId ? parseInt(initialNgoId, 10) || initialNgoId : null
    );
    ```
    **Risk Identified:** `parseInt(initialNgoId, 10)` can cause accidental integer coercion if a valid UUID string begins with numerals (e.g., `406d4371-aa9b...` becomes `406`). While the system falls back to `initialNgoId` for strings beginning with letters, numeric UUIDs will be truncated.
* **Classification:** **SUSPECTED RISK DOCUMENTED (Score: 8.5/10)**.

---

### WORKFLOW GROUP 16: Frontend-Backend Contract Drift & Serialization Gaps
Two distinct contract discrepancies were isolated:
1. **`CampaignPublicSerializer` Missing `ngo` UUID Field:**
   - Frontend `NeedRequestDetailsPage.jsx` (line 317) expects `campaign.ngo` to contain the NGO UUID to form a 1-click donation link:
     `to={campaign.ngo ? /donor/donations/money/step-2?campaignId=${campaign.id}&ngoId=${campaign.ngo} : ...}`.
   - However, backend `CampaignPublicSerializer` (lines 118–138 of `campaigns/serializers.py`) exposes:
     `fields = ['id', 'title', 'slug', 'category', 'campaign_type', 'short_description', 'description', 'target_amount', 'raised_amount', 'cover_image', 'start_date', 'end_date', 'status', 'is_featured', 'ngo_name', 'ngo_slug', 'ngo_logo', 'ngo_city', 'ngo_state', 'created_at']`.
   - `campaign.ngo` is omitted. As a result, the donor must navigate through Step 1 to re-select the NGO rather than directly proceeding to Step 2.
2. **`AdminAnalyticsService` Filter Syntax Bug:**
   - In `analytics/services.py` (lines 34–62):
     ```python
     ngo_stats = NGOProfile.objects.aggregate(
         total=Count('id'),
         verified=Count('id', filter=F('status') == 'APPROVED'),
         pending=Count('id', filter=F('status') == 'PENDING'),
         rejected=Count('id', filter=F('status') == 'REJECTED')
     )
     ```
   - In Django ORM, conditional aggregation requires `filter=Q(status='APPROVED')`. The expression `filter=F('status') == 'APPROVED'` evaluates in Python and results in 0 matches for all filtered counts (`verified: 0`, `pending: 0`, `rejected: 0`, `active: 0`, `open: 0`), despite the database containing 3 approved NGOs, 2 active campaigns, and 4 open tickets.
   - Furthermore, `pending=Count('id', filter=F('status') == 'PENDING')` uses `'PENDING'`, whereas `NGOProfile.Status` choices are `'SUBMITTED'` or `'UNDER_REVIEW'`.
* **Classification:** **CONFIRMED BUGS DOCUMENTED (Score: 7.5/10)**.

---

### WORKFLOW GROUP 17: IDOR, Role Scoping & Multi-Tenant Security Audits
* **Donations:** `DonorMonetaryDonationListView` and `DonorMonetaryDonationDetailView` enforce:
  `MonetaryDonation.objects.filter(donor=self.request.user)`. A donor cannot enumerate or download receipts belonging to another donor.
* **NGO Management:** `NGOCampaignListCreateView` enforces `Campaign.objects.filter(ngo=self.request.user.ngo_profile)`. An NGO cannot modify campaigns belonging to another NGO.
* **Corporate CSR:** `CompanyDashboardView` and `CompanyRequirementListView` restrict access to the authenticated user's company profile.
* **Admin Verification:** All admin routes require `IsAdminUser` / `role='ADMIN'`. Non-admin access results in 403 Forbidden.
* **Receipt Downloads:** `DonorMonetaryDonationReceiptPdfView` verifies `donor=request.user` and `status='SUCCESS'` before streaming the generated PDF.
* **Classification:** **CONFIRMED SECURE (Score: 10/10)**.

---

## 4. MASTER AUDIT SUMMARY TABLE

| Workflow / Domain | Status | Evidence / Verification | Problem / Gap Identified | Severity | Recommended Next Action |
|---|:---:|---|---|:---:|---|
| **Public NGO Discovery** | PASS | `NGOPublicListView` query verified; returns only active & approved trusts | None | Clean | Keep current implementation |
| **Public Campaign Directory** | PASS | `CampaignPublicListView` filters by campaign and NGO active status | None | Clean | Keep current implementation |
| **Campaign → Donation Link** | PARTIAL | `NeedRequestDetailsPage.jsx` checks `campaign.ngo` | `CampaignPublicSerializer` omits `ngo` (NGO UUID); forces extra step | Low | Add `'ngo'` or `'ngo_id'` to `CampaignPublicSerializer.fields` |
| **Donation Step 1 Coercion** | PARTIAL | `MoneyDonationStep1Page.jsx` line 13 | `parseInt(initialNgoId, 10)` can truncate numeric UUIDs to ints | Medium | Replace with `initialNgoId ? String(initialNgoId) : null` |
| **Donation Receipt Security** | PASS | Protected record `DG-M-20260831-8STYX2` intact; SHA-256 hash verified | None | Clean | Keep protected donation intact |
| **NGO Campaign State Machine** | PASS | Creation forces `DRAFT`; deletion restricted to draft | None | Clean | Keep current implementation |
| **Field Proof Lifecycle** | PASS | Geotagged proofs enforce 4-tier lifecycle & review queue | None | Clean | Ready for live milestone uploads |
| **CSR 49-Endpoint Suite** | PASS | All Company, NGO, and Admin endpoints registered in URL confs | Requirements and partnerships count is currently 0 | Normal Empty State | Seed initial CSR requirements for demo testing |
| **Grievance IDOR Isolation** | PASS | `IsTicketOwner` permission and `get_tickets_for_user()` verified | None | Clean | Keep current implementation |
| **Admin Analytics Aggregation** | **BUG** | `AdminAnalyticsService.get_overview()` returns 0 for all sub-counts | Uses `filter=F('status') == ...` instead of `filter=Q(status=...)` | High | Refactor to `Count('id', filter=Q(status='APPROVED'))` and fix status enum |
| **Company Analytics Hardcoding** | ADVISORY | `CompanyAnalyticsService` lines 158–160 | Hardcoded `milestone_completion_percentage: 0.0` and `"COMPLIANT"` | Low | Implement dynamic milestone calculation when partnerships exist |

---

## 5. ACTIONABLE RECOMMENDATIONS & ROADMAP

In accordance with strict read-only audit rules, **no changes were made during this audit phase**. The following recommendations are prioritized for subsequent implementation:

### High Priority
1. **Fix `AdminAnalyticsService` Aggregate Filters (`analytics/services.py`):**
   - Replace `filter=F('status') == '...'` with `filter=Q(status='...')` across `NGOProfile`, `Campaign`, and `GrievanceTicket` aggregations.
   - Correct the NGO pending query from `status='PENDING'` to `status__in=['SUBMITTED', 'UNDER_REVIEW']`.
2. **Expose NGO ID in Public Campaign Serializer (`campaigns/serializers.py`):**
   - Add `ngo` (or `ngo_id = serializers.UUIDField(source='ngo.id', read_only=True)`) to `CampaignPublicSerializer.Meta.fields`.
   - This enables `NeedRequestDetailsPage.jsx` to direct donors straight into Step 2 with both campaign and NGO context pre-populated.
3. **Remove Numeric Parsing in `MoneyDonationStep1Page.jsx`:**
   - Change `parseInt(initialNgoId, 10) || initialNgoId` to `String(initialNgoId)` to ensure numeric UUIDs are never corrupted.

### Medium Priority
1. **CSR Marketplace Demo Seeding:**
   - As CSR Requirements and Bilateral Partnerships are currently 0, create a read-only management command or test fixture to populate realistic CSR grants for end-to-end user demonstrations.
2. **Form 10BE Automated PDF Rendering:**
   - Currently, NGOs upload Form 10BE certificates manually. Consider adding an automated Form 10BE generation service using ReportLab matching the existing 80G tax receipt generator.

### Low Priority / Cosmetic
1. **Company Analytics Dynamic Metrics:**
   - Replace hardcoded `"COMPLIANT"` and `0.0` milestone completion percentages with dynamic queries once active partnerships exist.

---

## 6. CONCLUSION & AUDIT SIGNOFF

* **Protected Donation Record:** Verified **INTACT** (`DG-M-20260831-8STYX2`, ₹1,000.00, `SUCCESS`).
* **Database State:** Verified **INTACT** (37 public tables, 0 unauthorized rows added or modified).
* **Test Suites:** **1,571 / 1,571 Backend PASS**, **52 / 52 Frontend PASS**.
* **Final Transparency Grade:** **90.5 / 100 (GRADE A)**.
* **Read-Only Compliance:** **100% (Zero source code modifications, zero migrations, zero database writes)**.
