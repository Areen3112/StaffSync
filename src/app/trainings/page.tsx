'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Modal } from '@/components/ui/Modal';
import { trainingsApi } from '@/services/trainings-api';
import { TrainingProgram } from '@/types';
import {
  GraduationCap,
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import styles from './trainings.module.scss';

export default function TrainingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const canCreate = user?.role === 'hr' || user?.role === 'manager';

  const [trainings, setTrainings] = useState<TrainingProgram[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

  // Create form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructor: '',
    startDate: '',
    endDate: '',
    capacity: 25,
    category: 'Engineering',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const list = await trainingsApi.getAll({ status: activeTab, page, limit: 25 });
      setTrainings(list.trainings);
      setPagination(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleEnroll = async (id: string, title: string) => {
    try {
      await trainingsApi.enroll(id);
      dispatch(
        addToast({
          type: 'success',
          message: `Successfully enrolled in "${title}"!`,
        })
      );
      fetchTrainings();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Enrollment could not be processed.' }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trainingsApi.create(form);
      dispatch(addToast({ type: 'success', message: 'Training program scheduled successfully.' }));
      setIsCreateOpen(false);
      setPage(1);
      setForm({
        title: '',
        description: '',
        instructor: '',
        startDate: '',
        endDate: '',
        capacity: 25,
        category: 'Engineering',
      });
      fetchTrainings();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to schedule workshop.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTrainings = trainings.filter((t) => {
    if (activeTab === 'all') return true;
    return t.status === activeTab;
  });

  return (
    <AuthGuard>
      <AppLayout>
        <div className={styles.container}>
          {/* Header Row */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>Professional Development & Training</h2>
              <p className={styles.pageSubtitle}>
                Enterprise skill workshops, technical masterclasses, and executive leadership tracks.
              </p>
            </div>

            {canCreate && (
              <button
                className="pill-btn-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={16} /> Schedule Workshop
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              className={`${styles.tab} ${activeTab === 'upcoming' ? styles.active : ''}`}
              onClick={() => { setActiveTab('upcoming'); setPage(1); }}
            >
              Upcoming Workshops
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
              onClick={() => { setActiveTab('completed'); setPage(1); }}
            >
              Completed Programs
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => { setActiveTab('all'); setPage(1); }}
            >
              All Programs
            </button>
          </div>

          {/* Training Cards Grid */}
          <div className={styles.grid}>
            {loading ? (
              <div className={styles.emptyState}>Loading training curriculum...</div>
            ) : filteredTrainings.length === 0 ? (
              <div className={styles.emptyState}>No training programs found for this view.</div>
            ) : (
              filteredTrainings.map((trn) => {
                const isFull = trn.enrolledCount >= trn.capacity;
                const percentFilled = Math.min(100, (trn.enrolledCount / trn.capacity) * 100);

                return (
                  <div key={trn.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <span className="badge badge-info">{trn.category}</span>
                      <span
                        className={`badge ${
                          trn.status === 'completed'
                            ? 'badge-neutral'
                            : trn.isEnrolled
                            ? 'badge-success'
                            : 'badge-neutral'
                        }`}
                      >
                        {trn.status === 'completed'
                          ? 'COMPLETED'
                          : trn.isEnrolled
                          ? 'ENROLLED'
                          : 'OPEN'}
                      </span>
                    </div>

                    <h3 className={styles.title}>{trn.title}</h3>
                    <p className={styles.desc}>{trn.description}</p>

                    <div className={styles.metaRow}>
                      <div className={styles.metaItem}>
                        <Calendar size={14} className={styles.metaIcon} />
                        <span>
                          {trn.startDate} to {trn.endDate}
                        </span>
                      </div>
                      <div className={styles.metaItem}>
                        <Users size={14} className={styles.metaIcon} />
                        <span>Instructor: {trn.instructor}</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className={styles.capacityBox}>
                      <div className={styles.capacityMeta}>
                        <span>Capacity Seats</span>
                        <strong>
                          {trn.enrolledCount} / {trn.capacity} Enrolled
                        </strong>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.cardFooter}>
                      {trn.status === 'completed' ? (
                        <div className={styles.completedTag}>
                          <CheckCircle2 size={16} /> Course Curriculum Concluded
                        </div>
                      ) : trn.isEnrolled ? (
                        <div className={styles.enrolledTag}>
                          <CheckCircle2 size={16} /> You are Confirmed for this Workshop
                        </div>
                      ) : isFull ? (
                        <span className={styles.fullTag}>Workshop at Max Capacity</span>
                      ) : (
                        <button
                          className={styles.enrollBtn}
                          onClick={() => handleEnroll(trn.id, trn.title)}
                        >
                          Enroll in Workshop <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <PaginationControls page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />

          {/* Schedule Workshop Modal */}
          {isCreateOpen && (
            <Modal
              isOpen={isCreateOpen}
              onClose={() => setIsCreateOpen(false)}
              title="Schedule Training Program"
              description="Deploy a new technical workshop or corporate development seminar."
            >
              <form onSubmit={handleCreateSubmit} className={styles.createForm}>
                <div className={styles.fieldGroup}>
                  <label>Workshop Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Consensus & Raft Architecture"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Instructor / Speaker</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Helena Thorne"
                      value={form.instructor}
                      onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Track Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Product & Design">Product & Design</option>
                      <option value="Security & Compliance">Security & Compliance</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>End Date</label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Max Seat Capacity</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>Syllabus & Objectives Overview</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe target takeaways and prerequisites for attendees..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className="pill-btn-secondary"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="pill-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Scheduling...' : 'Launch Workshop'}
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
