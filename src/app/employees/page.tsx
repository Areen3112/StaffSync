'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Modal } from '@/components/ui/Modal';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { employeesApi } from '@/services/employees-api';
import { Employee, UserRole, EmployeeStatus } from '@/types';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  Shield,
  CheckCircle,
} from 'lucide-react';
import styles from './employees.module.scss';

export default function EmployeesPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isHR = user?.role === 'hr';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Modals
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
    department: 'Engineering',
    designation: '',
    phone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: 95000,
    status: 'active' as EmployeeStatus,
  });

  const [isPending, startTransition] = useTransition();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesApi.getAll({
        search,
        department: selectedDept,
        role: selectedRole,
        page,
        limit: 25,
      });
      setEmployees(res.employees);
      setPagination(res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, selectedRole, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeesApi.create(formData);
      dispatch(addToast({ type: 'success', message: `Employee ${formData.name} added successfully.` }));
      setIsCreateOpen(false);
      setPage(1);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: 'Engineering',
        designation: '',
        phone: '',
        joiningDate: new Date().toISOString().split('T')[0],
        salary: 95000,
        status: 'active',
      });
      fetchEmployees();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to create employee.' }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;

    try {
      await employeesApi.update(editEmployee.id, editEmployee);
      dispatch(addToast({ type: 'success', message: 'Employee updated successfully.' }));
      setEditEmployee(null);
      fetchEmployees();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update employee.' }));
    }
  };

  return (
    <AuthGuard allowedRoles={['hr', 'manager']}>
      <AppLayout>
        <div className={styles.container}>
          {/* Header Row */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>
                {user?.role === 'manager' ? 'Department Directory' : 'Employee Management'}
              </h2>
              <p className={styles.pageSubtitle}>
                Manage personnel records, departmental assignments, and role authorisations.
              </p>
            </div>

            {isHR && (
              <button
                className="pill-btn-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={16} /> Add Employee
              </button>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name, email, or designation..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterDropdowns}>
              <div className={styles.selectWrapper}>
                <Filter size={14} className={styles.filterIcon} />
                <select
                  value={selectedDept}
                  onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
                  className={styles.filterSelect}
                >
                  <option value="all">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="People Operations">People Operations</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                </select>
              </div>

              <div className={styles.selectWrapper}>
                <select
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
                  className={styles.filterSelect}
                >
                  <option value="all">All Roles</option>
                  <option value="hr">HR Admins</option>
                  <option value="manager">Managers</option>
                  <option value="employee">Employees</option>
                </select>
              </div>
            </div>
          </div>
          <PaginationControls page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />

          {/* Employee Table */}
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Joining Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={styles.loadingCell}>
                      Loading directory records...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>
                      No matching employee records found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.employeeCell}>
                          <div className={styles.avatar}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className={styles.empName}>{emp.name}</span>
                            <span className={styles.empDesignation}>{emp.designation}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.deptCell}>
                          <span className={styles.deptName}>{emp.department}</span>
                          <span className={styles.roleBadge}>{emp.role.toUpperCase()}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.contactCell}>
                          <span>{emp.email}</span>
                          <span className={styles.subContact}>{emp.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            emp.status === 'active'
                              ? 'badge-success'
                              : emp.status === 'on_leave'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                        >
                          {emp.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={styles.dateCell}>{emp.joiningDate}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => setViewEmployee(emp)}
                            title="View Employee Profile"
                          >
                            <Eye size={15} />
                          </button>
                          {isHR && (
                            <button
                              className={styles.iconBtn}
                              onClick={() => setEditEmployee({ ...emp })}
                              title="Edit Employee Records"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* View Modal */}
          {viewEmployee && (
            <Modal
              isOpen={!!viewEmployee}
              onClose={() => setViewEmployee(null)}
              title="Employee Profile"
              description={`Official record for ${viewEmployee.name}`}
            >
              <div className={styles.profileModalBody}>
                <div className={styles.profileHeader}>
                  <div className={styles.avatarLarge}>
                    {viewEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={styles.profileName}>{viewEmployee.name}</h3>
                    <p className={styles.profileDesignation}>{viewEmployee.designation}</p>
                    <span className="badge badge-success">{viewEmployee.status.toUpperCase()}</span>
                  </div>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Mail size={15} className={styles.detailIcon} />
                    <div>
                      <span className={styles.detailLabel}>Work Email</span>
                      <span className={styles.detailValue}>{viewEmployee.email}</span>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <Phone size={15} className={styles.detailIcon} />
                    <div>
                      <span className={styles.detailLabel}>Phone Contact</span>
                      <span className={styles.detailValue}>{viewEmployee.phone}</span>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <Building size={15} className={styles.detailIcon} />
                    <div>
                      <span className={styles.detailLabel}>Department</span>
                      <span className={styles.detailValue}>{viewEmployee.department}</span>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <Shield size={15} className={styles.detailIcon} />
                    <div>
                      <span className={styles.detailLabel}>Role Level</span>
                      <span className={styles.detailValue}>{viewEmployee.role.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <Calendar size={15} className={styles.detailIcon} />
                    <div>
                      <span className={styles.detailLabel}>Joining Date</span>
                      <span className={styles.detailValue}>{viewEmployee.joiningDate}</span>
                    </div>
                  </div>

                  {isHR && viewEmployee.salary && (
                    <div className={styles.detailItem}>
                      <Briefcase size={15} className={styles.detailIcon} />
                      <div>
                        <span className={styles.detailLabel}>Compensation (Annual)</span>
                        <span className={styles.detailValue}>
                          ${viewEmployee.salary.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Modal>
          )}

          {/* Create Employee Modal */}
          {isCreateOpen && (
            <Modal
              isOpen={isCreateOpen}
              onClose={() => setIsCreateOpen(false)}
              title="Add New Employee"
              description="Register a new workforce team member into StaffSync."
              maxWidth="600px"
            >
              <form onSubmit={handleCreateSubmit} className={styles.modalForm}>
                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Miller"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="jordan.miller@staffsync.io"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Initial Password</label>
                    <input type="password" minLength={8} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Designation / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lead Software Engineer"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product & Design">Product & Design</option>
                      <option value="People Operations">People Operations</option>
                      <option value="Finance & Legal">Finance & Legal</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value as UserRole })
                      }
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR Administrator</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Joining Date</label>
                    <input
                      type="date"
                      required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Annual Salary (USD)</label>
                    <input
                      type="number"
                      required
                      value={formData.salary}
                      onChange={(e) =>
                        setFormData({ ...formData, salary: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className="pill-btn-secondary"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pill-btn-primary">
                    Create Employee Record
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Edit Employee Modal */}
          {editEmployee && (
            <Modal
              isOpen={!!editEmployee}
              onClose={() => setEditEmployee(null)}
              title="Edit Employee"
              description={`Update information for ${editEmployee.name}`}
              maxWidth="600px"
            >
              <form onSubmit={handleEditSubmit} className={styles.modalForm}>
                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={editEmployee.name}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, name: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Designation</label>
                    <input
                      type="text"
                      required
                      value={editEmployee.designation}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, designation: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label>Department</label>
                    <select
                      value={editEmployee.department}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, department: e.target.value })
                      }
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product & Design">Product & Design</option>
                      <option value="People Operations">People Operations</option>
                      <option value="Finance & Legal">Finance & Legal</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Status</label>
                    <select
                      value={editEmployee.status}
                      onChange={(e) =>
                        setEditEmployee({
                          ...editEmployee,
                          status: e.target.value as EmployeeStatus,
                        })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className="pill-btn-secondary"
                    onClick={() => setEditEmployee(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pill-btn-primary">
                    Save Changes
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
