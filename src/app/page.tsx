'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Users,
  Clock,
  CalendarCheck2,
  GraduationCap,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import styles from './page.module.scss';

export default function LandingPage() {
  const [activeRoleTab, setActiveRoleTab] = useState<'hr' | 'manager' | 'employee'>('hr');

  const roleDetails = {
    hr: {
      title: 'Human Resource Administration',
      subtitle: 'Complete enterprise oversight, workforce records & compliance.',
      points: [
        'Centralized employee directory with department assignment & lifecycle control',
        'Company-wide attendance monitoring and automated monthly compliance audits',
        'Organization-level leave policy governance & reviewer arbitration',
        'Targeted announcement broadcast engine with urgent priority dispatch',
      ],
      badge: 'ADMINISTRATOR LEVEL',
    },
    manager: {
      title: 'Team Management & Approvals',
      subtitle: 'Delegated leadership for departmental productivity & approvals.',
      points: [
        'Direct reporting line visibility with authorized team members directory',
        'One-click leave approval/rejection with reviewer notes & balance checks',
        'Real-time team attendance status with shift oversight',
        'Departmental skill development tracking and workshop nominations',
      ],
      badge: 'MANAGEMENT LEVEL',
    },
    employee: {
      title: 'Employee Self-Service Portal',
      subtitle: 'Intuitive autonomy for daily work, leaves, and career advancement.',
      points: [
        'One-tap daily attendance clock-in and clock-out with work duration logging',
        'Transparent leave balance tracker with real-time status updates',
        'Interactive training catalog with one-click enrollment',
        'Direct notifications for approvals, company news & policy announcements',
      ],
      badge: 'STAFF LEVEL',
    },
  };

  return (
    <div className={styles.landingPage}>
      {/* Sleek Apple-style Navigation Bar */}
      <header className={styles.navBar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoIcon}>
              <ShieldCheck size={20} />
            </div>
            <span className={styles.logoText}>StaffSync</span>
          </Link>

          <nav className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#roles" className={styles.navLink}>Role Architecture</a>
            <a href="#preview" className={styles.navLink}>Platform Preview</a>
          </nav>

          <div className={styles.navActions}>
            <Link href="/login" className="pill-btn-secondary">
              Sign In
            </Link>
            <Link href="/dashboard" className="pill-btn-primary">
              Launch App <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.pillBadge}>
            <Sparkles size={14} className={styles.sparkle} />
            <span>Modern Workforce Management • Final College Implementation</span>
          </div>

          <h1 className={styles.heroHeadline}>
            Human Resources.
            <br />
            <span className="text-gradient">Engineered to perfection.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            StaffSync reimagines enterprise HRMS with Apple-inspired quiet precision.
            Seamlessly bridging HR administrators, managers, and employees in one unified,
            role-governed application.
          </p>

          <div className={styles.heroCtaGroup}>
            <Link href="/login" className={styles.primaryCta}>
              Access Enterprise Portal <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className={styles.secondaryCta}>
              Live Interactive Demo
            </Link>
          </div>
        </div>

        {/* Hero Interactive Mockup Preview */}
        <div className={styles.previewContainer} id="preview">
          <div className={styles.mockupFrame}>
            <div className={styles.mockupHeader}>
              <div className={styles.windowControls}>
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotGreen} />
              </div>
              <div className={styles.mockupAddress}>staffsync.internal/dashboard</div>
              <div className={styles.statusPill}>Live Production Preview</div>
            </div>

            <div className={styles.mockupBody}>
              {/* Mini mock metrics */}
              <div className={styles.mockGrid}>
                <div className={styles.mockMetricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.mockLabel}>Active Employees</span>
                    <Users size={16} className={styles.mockIcon} />
                  </div>
                  <span className={styles.mockValue}>128</span>
                  <span className={styles.mockDelta}>+4 this month</span>
                </div>

                <div className={styles.mockMetricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.mockLabel}>Today&apos;s Attendance</span>
                    <Clock size={16} className={styles.mockIcon} />
                  </div>
                  <span className={styles.mockValue}>95.3%</span>
                  <span className={styles.mockStatus}>On Track</span>
                </div>

                <div className={styles.mockMetricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.mockLabel}>Pending Leaves</span>
                    <CalendarCheck2 size={16} className={styles.mockIcon} />
                  </div>
                  <span className={styles.mockValue}>3 Requests</span>
                  <span className={styles.mockAction}>Awaiting Review</span>
                </div>

                <div className={styles.mockMetricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.mockLabel}>Upcoming Workshops</span>
                    <GraduationCap size={16} className={styles.mockIcon} />
                  </div>
                  <span className={styles.mockValue}>2 Active</span>
                  <span className={styles.mockDelta}>Engineering Q4</span>
                </div>
              </div>

              {/* Realistic mini table inside mockup */}
              <div className={styles.mockTableContainer}>
                <div className={styles.mockTableHeader}>
                  <span>Recent Activity Stream</span>
                  <span className={styles.mockFilter}>All Roles</span>
                </div>
                <div className={styles.mockRow}>
                  <span className={styles.avatarMini}>AC</span>
                  <div className={styles.mockRowText}>
                    <strong>Aria Chen</strong> marked attendance (Clock-in at 09:02 AM)
                  </div>
                  <span className="badge badge-success">Present</span>
                </div>
                <div className={styles.mockRow}>
                  <span className={styles.avatarMini}>DH</span>
                  <div className={styles.mockRowText}>
                    <strong>Devon Hayes</strong> requested 1 day Sick Leave
                  </div>
                  <span className="badge badge-warning">Pending Review</span>
                </div>
                <div className={styles.mockRow}>
                  <span className={styles.avatarMini}>EV</span>
                  <div className={styles.mockRowText}>
                    <strong>Eleanor Vance</strong> published: Q4 All-Hands Meeting & Roadmap
                  </div>
                  <span className="badge badge-info">Broadcast</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Architecture Section */}
      <section className={styles.rolesSection} id="roles">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionPre}>Tri-Tier Governance</span>
          <h2 className={styles.sectionTitle}>Built for every tier of the modern workforce.</h2>
          <p className={styles.sectionSubtitle}>
            Dedicated views, distinct permissions, and strict backend-enforced boundaries.
          </p>
        </div>

        <div className={styles.roleTabsContainer}>
          <div className={styles.tabsNav}>
            <button
              className={`${styles.tabBtn} ${activeRoleTab === 'hr' ? styles.active : ''}`}
              onClick={() => setActiveRoleTab('hr')}
            >
              HR Administrator
            </button>
            <button
              className={`${styles.tabBtn} ${activeRoleTab === 'manager' ? styles.active : ''}`}
              onClick={() => setActiveRoleTab('manager')}
            >
              Team Manager
            </button>
            <button
              className={`${styles.tabBtn} ${activeRoleTab === 'employee' ? styles.active : ''}`}
              onClick={() => setActiveRoleTab('employee')}
            >
              Employee Portal
            </button>
          </div>

          <div className={styles.tabContentCard}>
            <div className={styles.tabMeta}>
              <span className="badge badge-neutral">{roleDetails[activeRoleTab].badge}</span>
              <h3 className={styles.tabTitle}>{roleDetails[activeRoleTab].title}</h3>
              <p className={styles.tabSubtitle}>{roleDetails[activeRoleTab].subtitle}</p>
            </div>
            <ul className={styles.tabPointsList}>
              {roleDetails[activeRoleTab].points.map((pt, i) => (
                <li key={i} className={styles.pointItem}>
                  <CheckCircle2 size={18} className={styles.checkIcon} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
            <div className={styles.tabFooter}>
              <Link href={`/login?role=${activeRoleTab}`} className="pill-btn-primary">
                Login as {roleDetails[activeRoleTab].badge} <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionPre}>Comprehensive Workflows</span>
          <h2 className={styles.sectionTitle}>Everything an enterprise needs. Nothing it doesn&apos;t.</h2>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.cardIconBox}>
              <Users size={24} />
            </div>
            <h3 className={styles.featureTitle}>Employee Management</h3>
            <p className={styles.featureText}>
              Complete lifecycle tracking from onboarding to promotion. Assign reporting managers,
              monitor designations, and manage department allocations.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.cardIconBox}>
              <Clock size={24} />
            </div>
            <h3 className={styles.featureTitle}>Precision Attendance</h3>
            <p className={styles.featureText}>
              Clock-in and clock-out with zero friction. Automatic duration calculation, date
              filtering, and team attendance summaries for daily operations.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.cardIconBox}>
              <CalendarCheck2 size={24} />
            </div>
            <h3 className={styles.featureTitle}>Streamlined Leave System</h3>
            <p className={styles.featureText}>
              Apply with dynamic balance enforcement. Managers review with contextual comments,
              while HR maintains company-wide oversight.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.cardIconBox}>
              <GraduationCap size={24} />
            </div>
            <h3 className={styles.featureTitle}>Training Programs</h3>
            <p className={styles.featureText}>
              Empower team development with course catalogs, seat capacities, and seamless
              enrollments. Keep technical capabilities sharp.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.cardIconBox}>
              <BarChart3 size={24} />
            </div>
            <h3 className={styles.featureTitle}>Reports & Analytics</h3>
            <p className={styles.featureText}>
              Real-time attendance trends, leave distribution charts, and workforce density metrics
              designed for leadership reviews.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.cardIconBox}>
              <Layers size={24} />
            </div>
            <h3 className={styles.featureTitle}>Announcements Engine</h3>
            <p className={styles.featureText}>
              Target communications by role or broadcast company-wide. Tag urgent notices so no
              critical company development goes unseen.
            </p>
          </div>
        </div>
      </section>

      {/* Apple-style Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrandRow}>
            <div className={styles.footerLogo}>
              <ShieldCheck size={18} />
              <span>StaffSync</span>
            </div>
            <p className={styles.footerDisclaimer}>
              StaffSync HRMS is developed as a senior college project adhering to modern Apple design
              specifications and full-stack API integration. Built with Next.js, TypeScript, SCSS,
              and Redux Toolkit.
            </p>
          </div>

          <div className={styles.footerLinksGrid}>
            <div className={styles.footerCol}>
              <h4>Navigation</h4>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/employees">Employees</Link>
              <Link href="/attendance">Attendance</Link>
              <Link href="/leaves">Leave System</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>Role Portals</h4>
              <Link href="/login?role=hr">HR Administrator</Link>
              <Link href="/login?role=manager">Team Manager</Link>
              <Link href="/login?role=employee">Employee Portal</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>Architecture</h4>
              <span>Express / MongoDB API</span>
              <span>Next.js App Router</span>
              <span>Redux Toolkit State</span>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} StaffSync Inc. All rights reserved.</p>
            <div className={styles.footerLegal}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security Standards</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
