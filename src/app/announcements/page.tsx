'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Modal } from '@/components/ui/Modal';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { announcementsApi } from '@/services/announcements-api';
import { Announcement } from '@/types';
import {
  BellRing,
  Plus,
  Calendar,
  User,
  AlertTriangle,
  Megaphone,
  CheckCircle,
} from 'lucide-react';
import styles from './announcements.module.scss';

export default function AnnouncementsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const canPublish = user?.role === 'hr' || user?.role === 'manager';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Create form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetAudience: 'all' as Announcement['targetAudience'],
    priority: 'normal' as Announcement['priority'],
    authorName: user?.name || 'Administrator',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const list = await announcementsApi.getAll({ page, limit: 25 });
      setAnnouncements(list.announcements);
      setPagination(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      dispatch(addToast({ type: 'error', message: 'Title and content are required.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await announcementsApi.create({
        ...form,
        authorName: user?.name || 'Administrator',
      });
      dispatch(addToast({ type: 'success', message: 'Announcement broadcasted successfully.' }));
      setIsCreateOpen(false);
      setPage(1);
      setForm({
        title: '',
        content: '',
        targetAudience: 'all',
        priority: 'normal',
        authorName: user?.name || 'Administrator',
      });
      fetchAnnouncements();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to broadcast announcement.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>Company Announcements</h2>
              <p className={styles.pageSubtitle}>
                Official enterprise notices, policy updates, and executive briefings.
              </p>
            </div>

            {canPublish && (
              <button
                className="pill-btn-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={16} /> Broadcast Notice
              </button>
            )}
          </div>

          {/* Announcements Grid */}
          <div className={styles.grid}>
            {loading ? (
              <div className={styles.emptyState}>Loading broadcasts...</div>
            ) : announcements.length === 0 ? (
              <div className={styles.emptyState}>No announcements active right now.</div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`${styles.card} ${
                    ann.priority === 'urgent' ? styles.urgentCard : ''
                  }`}
                  onClick={() => setSelectedAnnouncement(ann)}
                >
                  <div className={styles.cardHeader}>
                    <span
                      className={`badge ${
                        ann.priority === 'urgent' ? 'badge-danger' : 'badge-neutral'
                      }`}
                    >
                      {ann.priority === 'urgent' && <AlertTriangle size={12} />}
                      {ann.priority.toUpperCase()}
                    </span>
                    <span className={styles.audienceTag}>
                      Audience: <strong>{ann.targetAudience.toUpperCase()}</strong>
                    </span>
                  </div>

                  <h3 className={styles.title}>{ann.title}</h3>
                  <p className={styles.contentSnippet}>{ann.content}</p>

                  <div className={styles.cardFooter}>
                    <div className={styles.authorMeta}>
                      <User size={13} />
                      <span>{ann.authorName}</span>
                    </div>
                    <div className={styles.dateMeta}>
                      <Calendar size={13} />
                      <span>{ann.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />

          {/* Announcement Detail Modal */}
          {selectedAnnouncement && (
            <Modal
              isOpen={!!selectedAnnouncement}
              onClose={() => setSelectedAnnouncement(null)}
              title={selectedAnnouncement.title}
              description={`Broadcasted by ${selectedAnnouncement.authorName} on ${selectedAnnouncement.createdAt}`}
            >
              <div className={styles.modalContent}>
                <div className={styles.modalBadges}>
                  <span
                    className={`badge ${
                      selectedAnnouncement.priority === 'urgent'
                        ? 'badge-danger'
                        : 'badge-neutral'
                    }`}
                  >
                    {selectedAnnouncement.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="badge badge-info">
                    AUDIENCE: {selectedAnnouncement.targetAudience.toUpperCase()}
                  </span>
                </div>
                <div className={styles.fullText}>{selectedAnnouncement.content}</div>
                <div className={styles.modalActions}>
                  <button
                    className="pill-btn-primary"
                    onClick={() => setSelectedAnnouncement(null)}
                  >
                    Acknowledge Notice
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Create Announcement Modal */}
          {isCreateOpen && (
            <Modal
              isOpen={isCreateOpen}
              onClose={() => setIsCreateOpen(false)}
              title="Broadcast Announcement"
              description="Publish a notice to the selected workforce group."
            >
              <form onSubmit={handleCreateSubmit} className={styles.createForm}>
                <div className={styles.fieldGroup}>
                  <label>Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Company Strategy All-Hands"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Target Audience</label>
                    <select
                      value={form.targetAudience}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          targetAudience: e.target.value as Announcement['targetAudience'],
                        })
                      }
                    >
                      <option value="all">Company-Wide (All Employees)</option>
                      <option value="employee">Employees Only</option>
                      <option value="manager">Managers Only</option>
                      <option value="hr">HR Admins Only</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          priority: e.target.value as Announcement['priority'],
                        })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Full Content Body</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write your official announcement details here..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
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
                    {isSubmitting ? 'Publishing...' : 'Dispatch Broadcast'}
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
