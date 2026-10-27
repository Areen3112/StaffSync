'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Modal } from '@/components/ui/Modal';
import { leavesApi } from '@/services/leaves-api';
import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '@/types';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  FileText,
} from 'lucide-react';
import styles from './leaves.module.scss';

export default function LeavesPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isApprover = user?.role === 'manager' || user?.role === 'hr';

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Apply modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'annual' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review modal
  const [reviewLeave, setReviewLeave] = useState<LeaveRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leavesApi.getAll(
        { ...(statusFilter !== 'all' ? { status: statusFilter } : {}), page, limit: 25 }
      );
      setLeaves(res.leaves);
      setBalance(res.balance);
      setPagination(res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason) {
      dispatch(addToast({ type: 'error', message: 'Please complete all required fields.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await leavesApi.apply(applyForm);
      dispatch(addToast({ type: 'success', message: 'Leave application submitted successfully.' }));
      setIsApplyOpen(false);
      setPage(1);
      setApplyForm({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchLeaves();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to submit leave request.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (status: LeaveStatus) => {
    if (!reviewLeave) return;

    try {
      await leavesApi.decide(reviewLeave.id, {
        status,
        reviewerComment: reviewComment || undefined,
      });
      dispatch(
        addToast({
          type: 'success',
          message: `Leave request has been ${status}.`,
        })
      );
      setReviewLeave(null);
      setReviewComment('');
      fetchLeaves();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Decision could not be submitted.' }));
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className={styles.container}>
          {/* Header Row */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>Leave Management</h2>
              <p className={styles.pageSubtitle}>
                {isApprover
                  ? 'Review team leave requests, monitor balances and grant departmental approvals.'
                  : 'Track your annual leave balances and submit time-off requests.'}
              </p>
            </div>

            <button
              className="pill-btn-primary"
              onClick={() => setIsApplyOpen(true)}
            >
              <Plus size={16} /> Apply for Leave
            </button>
          </div>

          {/* Leave Balances Cards */}
          {balance && (
            <div className={styles.balanceGrid}>
              <div className={styles.balanceCard}>
                <span className={styles.balanceLabel}>Total Available</span>
                <span className={styles.balanceNum}>{balance.remaining}</span>
                <span className={styles.balanceSub}>Days remaining in cycle</span>
              </div>
              <div className={styles.balanceCard}>
                <span className={styles.balanceLabel}>Annual Leave</span>
                <span className={styles.balanceNum}>{balance.annual}</span>
                <span className={styles.balanceSub}>Vacation allowance</span>
              </div>
              <div className={styles.balanceCard}>
                <span className={styles.balanceLabel}>Sick Leave</span>
                <span className={styles.balanceNum}>{balance.sick}</span>
                <span className={styles.balanceSub}>Medical quota</span>
              </div>
              <div className={styles.balanceCard}>
                <span className={styles.balanceLabel}>Casual Leave</span>
                <span className={styles.balanceNum}>{balance.casual}</span>
                <span className={styles.balanceSub}>Personal contingency</span>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              className={`${styles.tab} ${statusFilter === 'all' ? styles.active : ''}`}
              onClick={() => { setStatusFilter('all'); setPage(1); }}
            >
              All Requests
            </button>
            <button
              className={`${styles.tab} ${statusFilter === 'pending' ? styles.active : ''}`}
              onClick={() => { setStatusFilter('pending'); setPage(1); }}
            >
              Pending Review
            </button>
            <button
              className={`${styles.tab} ${statusFilter === 'approved' ? styles.active : ''}`}
              onClick={() => { setStatusFilter('approved'); setPage(1); }}
            >
              Approved
            </button>
            <button
              className={`${styles.tab} ${statusFilter === 'rejected' ? styles.active : ''}`}
              onClick={() => { setStatusFilter('rejected'); setPage(1); }}
            >
              Rejected
            </button>
          </div>
          <PaginationControls page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />

          {/* Leaves Table */}
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {isApprover && <th style={{ textAlign: 'right' }}>Review</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isApprover ? 7 : 6} className={styles.emptyCell}>
                      Loading leave records...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={isApprover ? 7 : 6} className={styles.emptyCell}>
                      No leave requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  leaves.map((lv) => (
                    <tr key={lv.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.empCell}>
                          <span className={styles.empName}>{lv.employeeName || user?.name}</span>
                          <span className={styles.empDept}>{lv.department || user?.department}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.typeBadge}>
                          {lv.leaveType.toUpperCase()} LEAVE
                        </span>
                      </td>
                      <td>
                        <span className={styles.durationTag}>
                          {lv.daysCount} {lv.daysCount === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.datesCell}>
                          <span>{lv.startDate}</span>
                          <span className={styles.dateTo}>to {lv.endDate}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.reasonText} title={lv.reason}>
                          {lv.reason}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            lv.status === 'approved'
                              ? 'badge-success'
                              : lv.status === 'rejected'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {lv.status.toUpperCase()}
                        </span>
                      </td>
                      {isApprover && (
                        <td style={{ textAlign: 'right' }}>
                          {lv.status === 'pending' ? (
                            <button
                              className={styles.reviewBtn}
                              onClick={() => {
                                setReviewLeave(lv);
                                setReviewComment('');
                              }}
                            >
                              Review
                            </button>
                          ) : (
                            <span className={styles.reviewedLabel}>Decision finalized</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Apply Leave Modal */}
          {isApplyOpen && (
            <Modal
              isOpen={isApplyOpen}
              onClose={() => setIsApplyOpen(false)}
              title="Apply for Leave"
              description="Submit a planned absence request for manager evaluation."
            >
              <form onSubmit={handleApplySubmit} className={styles.modalForm}>
                <div className={styles.fieldGroup}>
                  <label>Leave Type</label>
                  <select
                    value={applyForm.leaveType}
                    onChange={(e) =>
                      setApplyForm({ ...applyForm, leaveType: e.target.value as LeaveType })
                    }
                  >
                    <option value="annual">Annual Leave (Vacation)</option>
                    <option value="sick">Sick Leave (Medical)</option>
                    <option value="casual">Casual Leave (Personal)</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      required
                      value={applyForm.startDate}
                      onChange={(e) =>
                        setApplyForm({ ...applyForm, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>End Date</label>
                    <input
                      type="date"
                      required
                      value={applyForm.endDate}
                      onChange={(e) =>
                        setApplyForm({ ...applyForm, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Reason & Handoff Notes</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about your leave and relevant team coverage..."
                    value={applyForm.reason}
                    onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className="pill-btn-secondary"
                    onClick={() => setIsApplyOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="pill-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Review Decision Modal */}
          {reviewLeave && (
            <Modal
              isOpen={!!reviewLeave}
              onClose={() => setReviewLeave(null)}
              title="Review Leave Application"
              description={`Evaluation for ${reviewLeave.employeeName || 'Employee'}`}
            >
              <div className={styles.reviewModalBody}>
                <div className={styles.requestSummary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.sumLabel}>Leave Type:</span>
                    <strong>{reviewLeave.leaveType.toUpperCase()}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.sumLabel}>Requested Duration:</span>
                    <span>
                      {reviewLeave.startDate} to {reviewLeave.endDate} ({reviewLeave.daysCount} days)
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.sumLabel}>Applicant Reason:</span>
                    <p className={styles.reasonBox}>{reviewLeave.reason}</p>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Reviewer Notes / Feedback (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved. Please ensure client deliverables are synced."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <div className={styles.decisionActions}>
                  <button
                    type="button"
                    className={styles.rejectBtn}
                    onClick={() => handleDecision('rejected')}
                  >
                    <XCircle size={16} /> Reject Request
                  </button>
                  <button
                    type="button"
                    className={styles.approveBtn}
                    onClick={() => handleDecision('approved')}
                  >
                    <CheckCircle2 size={16} /> Approve Leave
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
