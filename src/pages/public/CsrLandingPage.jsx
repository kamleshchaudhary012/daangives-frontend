import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

// ─── Static content — zero API calls ───────────────────────────────────────

const COMPANY_BENEFITS = [
  {
    icon: 'search',
    title: 'Discover Aligned Projects',
    desc: 'Browse admin-verified NGO proposals organised by Schedule VII focus area, geography, and budget range.',
  },
  {
    icon: 'tune',
    title: 'Match by Category & Location',
    desc: 'Filter by Section 135 compliance categories, state, district, and beneficiary demographics.',
  },
  {
    icon: 'contract_edit',
    title: 'Express Interest via Structured EOIs',
    desc: 'Submit formal Expressions of Interest with pre-set funding amount and timeline.',
  },
  {
    icon: 'handshake',
    title: 'Track Bilateral Partnerships',
    desc: 'Monitor milestones, disbursement schedules, and progress through a dedicated partnership dashboard.',
  },
  {
    icon: 'receipt_long',
    title: 'Report Section 135 Disbursements',
    desc: 'Log all fund transfers with evidence uploads for Board CSR Committee and statutory reporting.',
  },
];

const NGO_BENEFITS = [
  {
    icon: 'post_add',
    title: 'Publish Section 135 Proposals',
    desc: 'Create detailed CSR requirement documents with budget breakdowns, Schedule VII alignment, and beneficiary details.',
  },
  {
    icon: 'storefront',
    title: 'Reach Corporate Sponsors',
    desc: 'Once admin-approved, proposals appear on the Marketplace visible to eligible registered companies.',
  },
  {
    icon: 'inbox',
    title: 'Review Inbound Corporate Interest',
    desc: 'Receive and respond to structured EOIs from companies via a secure partnership request inbox.',
  },
  {
    icon: 'flag',
    title: 'Manage Partnership Milestones',
    desc: 'Co-manage project milestones with corporate partners and mark deliverables as completed.',
  },
  {
    icon: 'camera',
    title: 'Submit Ground Execution Evidence',
    desc: 'Upload field photos, beneficiary data, and outcome reports directly against each milestone.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: 'check_circle',
    title: 'NGO Publishes Verified Proposal',
    desc: 'A registered NGO submits a Section 135 CSR proposal with Schedule VII alignment, target geography, budget, and beneficiary data. DaanGives Admin reviews and approves the proposal for the Marketplace.',
    color: 'text-secondary',
    bgColor: 'bg-secondary-container/20',
    borderColor: 'border-secondary/30',
  },
  {
    step: '02',
    icon: 'search',
    title: 'Company Discovers & Expresses Interest',
    desc: 'An approved corporate CSR user browses the Marketplace, filters by Schedule VII category and location, reviews the NGO proposal dossier, and submits a formal Expression of Interest (EOI) with funding commitment.',
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/30',
  },
  {
    step: '03',
    icon: 'task_alt',
    title: 'Partnership Established → Milestones Tracked',
    desc: 'The NGO accepts the EOI and a bilateral partnership is created. Both parties track milestones, disbursements, and ground-level evidence through an auditable, immutable ledger until project completion.',
    color: 'text-tertiary',
    bgColor: 'bg-tertiary/5',
    borderColor: 'border-tertiary/30',
  },
];

const TRUST_PILLARS = [
  {
    icon: 'admin_panel_settings',
    title: 'Admin Verification Workflow',
    desc: 'Every corporate profile and NGO proposal is reviewed by a DaanGives administrator before being listed on the platform.',
  },
  {
    icon: 'gavel',
    title: 'Schedule VII Alignment',
    desc: 'All CSR proposals are classified against the 14 Schedule VII activity areas of the Companies Act, 2013.',
  },
  {
    icon: 'history_edu',
    title: 'Immutable Audit Trail',
    desc: 'Every status transition, moderation decision, and disbursement event is logged in a tamper-evident audit ledger.',
  },
  {
    icon: 'lock',
    title: 'Secure Role-Based Access',
    desc: 'Company, NGO, and Admin accounts operate on strict role-based authentication with zero cross-role data leakage.',
  },
];

const FAQS = [
  {
    q: 'Who can register as a Company?',
    a: 'Any company incorporated under the Companies Act, 2013 that is subject to Section 135 CSR obligations can register. You will be asked for your MCA Corporate Identification Number (CIN), Income Tax PAN, and details of your Board CSR Committee. Registration is subject to DaanGives admin verification before you can access the CSR Marketplace.',
  },
  {
    q: 'How are NGOs verified on the platform?',
    a: 'NGOs must complete a full registration profile including NGO-Darpan UID, 12A/80G tax exemption certificates, FCRA registration (if applicable), NITI Aayog Darpan ID, and authorised signatory bank details. Each profile is reviewed and approved by a DaanGives admin before it is publicly listed.',
  },
  {
    q: 'Is payment or fund transfer handled on the platform?',
    a: 'No. DaanGives CSR Connect is a connection and tracking platform. Fund disbursements are managed directly between the corporate CSR department and the NGO via NEFT/RTGS as per the bilateral partnership agreement. The platform provides disbursement logging and milestone-linked evidence submission for Section 135 compliance documentation.',
  },
  {
    q: 'What is Schedule VII under the Companies Act, 2013?',
    a: 'Schedule VII specifies the 14 permissible CSR activity areas under the Companies Act, 2013 — including eradicating hunger, promoting education, gender equality, environmental sustainability, protection of national heritage, welfare of armed forces veterans, rural sports, contributions to PM National Relief Fund, technology incubators, rural development, and more. CSR spending must be directed toward one or more of these categories.',
  },
  {
    q: 'How is trust and accountability maintained between parties?',
    a: 'Trust is maintained through a multi-layer system: mandatory admin verification of both corporate and NGO parties before they can interact, structured milestone tracking with mandatory evidence uploads, an immutable audit ledger recording every platform event, and role-based access ensuring companies only see what they need and NGOs only manage their own proposals.',
  },
  {
    q: 'Can I browse CSR proposals before registering?',
    a: 'No — the CSR Marketplace is accessible only to registered and admin-approved corporate CSR users. This ensures proposal visibility is restricted to genuine Section 135-eligible companies and protects NGO data from unauthorised access.',
  },
];

export default function CsrLandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <PublicLayout>
      {/* ================================================================ */}
      {/* A. HERO SECTION */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-container-low via-surface to-background py-20 lg:py-28">
        {/* Background decorative rings */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-primary/10 opacity-60 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full border border-secondary/10 opacity-60 pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-7">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-sm">corporate_fare</span>
              <span>CSR Connect by DaanGives</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-tight">
              Connect Corporate{' '}
              <span className="text-primary">CSR Budgets</span>{' '}
              with Verified{' '}
              <span className="text-secondary">NGO Projects</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-on-surface-variant font-normal leading-relaxed max-w-2xl mx-auto">
              A structured, transparent platform connecting corporate India's CSR initiatives with
              admin-verified NGOs across the nation — Section 135 compliance simplified.
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                id="csr-hero-register-company"
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all shadow-lg text-center text-sm inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">domain</span>
                Register as Company
              </Link>
              <Link
                id="csr-hero-register-ngo"
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-secondary text-on-secondary font-bold rounded-xl hover:bg-on-secondary-container transition-all shadow-lg text-center text-sm inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">volunteer_activism</span>
                Register as NGO
              </Link>
            </div>

            {/* Secondary login CTA */}
            <p className="text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link
                id="csr-hero-login"
                to="/login"
                className="text-primary font-semibold hover:underline underline-offset-2"
              >
                Log In →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* B. VALUE PROPOSITION — TWO COLUMNS */}
      {/* ================================================================ */}
      <section className="py-20 bg-surface-container-low border-t border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">Built for Both Sides</h2>
            <p className="text-sm text-on-surface-variant">
              CSR Connect serves corporate CSR departments and NGO implementing partners with
              dedicated, role-specific tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left — For Companies */}
            <div
              id="csr-value-companies"
              className="bg-surface-container-lowest rounded-3xl p-8 border border-primary/20 shadow-md space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">domain</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">For Companies</div>
                  <h3 className="text-xl font-bold text-on-surface">Corporate CSR Department</h3>
                </div>
              </div>

              <ul className="space-y-4">
                {COMPANY_BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">{b.icon}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-on-surface block">{b.title}</span>
                      <span className="text-xs text-on-surface-variant leading-relaxed">{b.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                id="csr-value-company-cta"
                to="/register"
                className="w-full py-3 bg-primary text-on-primary text-sm font-bold rounded-xl hover:bg-primary-container transition-all text-center block"
              >
                Explore Corporate Onboarding
              </Link>
            </div>

            {/* Right — For NGOs */}
            <div
              id="csr-value-ngos"
              className="bg-surface-container-lowest rounded-3xl p-8 border border-secondary/20 shadow-md space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-secondary uppercase tracking-wider">For NGOs</div>
                  <h3 className="text-xl font-bold text-on-surface">NGO Implementing Partner</h3>
                </div>
              </div>

              <ul className="space-y-4">
                {NGO_BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary/8 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">{b.icon}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-on-surface block">{b.title}</span>
                      <span className="text-xs text-on-surface-variant leading-relaxed">{b.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                id="csr-value-ngo-cta"
                to="/register"
                className="w-full py-3 bg-secondary text-on-secondary text-sm font-bold rounded-xl hover:bg-on-secondary-container transition-all text-center block"
              >
                Submit Section 135 Proposal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* C. HOW IT WORKS — 3-STEP FLOW */}
      {/* ================================================================ */}
      <section className="py-20 bg-surface border-t border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">How CSR Connect Works</h2>
            <p className="text-sm text-on-surface-variant">
              A structured three-step process from proposal submission to project completion.
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Connector line (desktop only) */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-secondary/30 via-primary/30 to-tertiary/30"
            />

            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className={`relative bg-surface-container-lowest rounded-3xl p-7 border ${step.borderColor} space-y-4 shadow-sm`}
              >
                {/* Step number badge */}
                <div className={`inline-flex items-center gap-2 text-xs font-bold ${step.color}`}>
                  <span className="font-mono font-black text-2xl opacity-30">{step.step}</span>
                </div>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl ${step.bgColor} border ${step.borderColor} ${step.color} flex items-center justify-center`}
                >
                  <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-on-surface">{step.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* D. COMPLIANCE & TRUST */}
      {/* ================================================================ */}
      <section className="py-20 bg-surface-container border-t border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/30 border border-secondary/30 text-secondary text-xs font-bold">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Platform Compliance & Trust
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">
              Accountability Built Into Every Step
            </h2>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
              DaanGives CSR Connect is designed around statutory compliance, transparent governance,
              and secure role-based data access.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/60 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">{pillar.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface">{pillar.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

          {/* Statutory compliance strip */}
          <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 flex items-center gap-3 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-xl text-primary shrink-0">info</span>
            <span>
              CSR Connect is designed for compliance with the{' '}
              <strong className="text-on-surface">Companies Act, 2013 Section 135</strong> and{' '}
              <strong className="text-on-surface">Companies (CSR Policy) Rules, 2014</strong>.
              Platform workflows support auditable documentation and do not constitute formal legal counsel.
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* E. FAQ */}
      {/* ================================================================ */}
      <section className="py-20 bg-surface-container-low border-t border-outline-variant/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-on-surface-variant">
              Answers to common questions about CSR Connect, registration, and platform mechanics.
            </p>
          </div>

          <div className="space-y-3" id="csr-faq-list">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden"
              >
                <button
                  id={`csr-faq-${index}`}
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-surface-container-low transition-colors"
                  aria-expanded={openFaqIndex === index}
                >
                  <span className="text-sm font-semibold text-on-surface">{faq.q}</span>
                  <span
                    className={`material-symbols-outlined text-xl text-primary shrink-0 transition-transform duration-200 ${
                      openFaqIndex === index ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {openFaqIndex === index && (
                  <div className="px-6 pb-5 pt-1 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* F. FINAL CTA */}
      {/* ================================================================ */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-surface to-secondary/5 border-t border-outline-variant/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-on-surface">
              Ready to Get Started?
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Join corporate India's structured CSR matching platform. Register today and start
              making a verified, auditable social impact.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              id="csr-final-cta-company"
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all shadow-lg text-center text-sm inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">domain</span>
              Register as Company
            </Link>
            <Link
              id="csr-final-cta-ngo"
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-secondary text-on-secondary font-bold rounded-xl hover:bg-on-secondary-container transition-all shadow-lg text-center text-sm inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">volunteer_activism</span>
              Register as NGO
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant">
            Already registered?{' '}
            <Link
              id="csr-final-cta-login"
              to="/login"
              className="text-primary font-semibold hover:underline underline-offset-2"
            >
              Log In to your account
            </Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
