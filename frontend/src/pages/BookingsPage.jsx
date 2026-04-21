import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Modal, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { authAPI, bookingAPI, resourceAPI } from '../services/api';
import OperationsSidebar from '../components/OperationsSidebar';
import TopbarUserMenu from '../components/TopbarUserMenu';

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = `
.bp-page{min-height:100vh;display:grid;grid-template-columns:285px 1fr;background:#f2f4f8;font-family:'Segoe UI',sans-serif;}
.bp-sidebar{background:radial-gradient(circle at 10% 0%,#1e376f 0%,#152d5d 30%,#0f2349 60%,#0b1b3b 100%);color:#e9efff;border-right:1px solid rgba(255,255,255,.1);padding:14px 12px;}
.bp-brand{height:66px;display:flex;align-items:center;gap:10px;font-weight:600;padding:0 8px;border-bottom:1px solid rgba(255,255,255,.14);margin-bottom:16px;}
.bp-nav{display:flex;flex-direction:column;gap:6px;}
.bp-nav-item{border:none;background:transparent;color:#d7e2ff;font-size:16px;text-align:left;padding:11px 14px;border-radius:8px;display:flex;align-items:center;gap:12px;cursor:pointer;}
.bp-nav-item span{width:26px;text-align:center;}
.bp-nav-item-active{background:linear-gradient(90deg,#2f5bb3,#315fae);color:#fff;}
.bp-main{display:flex;flex-direction:column;overflow:hidden;}
.bp-topbar{min-height:82px;background:#f8f9fc;border-bottom:1px solid #d9dee8;display:flex;align-items:center;justify-content:space-between;padding:0 30px;}
.bp-topbar h1{margin:0;font-size:24px;font-weight:600;color:#1d2433;}
.bp-user-menu{display:flex;align-items:center;gap:12px;font-size:16px;color:#2b3444;}
.bp-logout-btn{border:1px solid #d4d9e2;border-radius:6px;background:#fff;color:#2b3444;font-size:14px;padding:6px 10px;cursor:pointer;}
.bp-content{padding:22px 30px;}
.bp-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.bp-tab{padding:8px 18px;border-radius:8px;border:1px solid #ccd3df;background:#fff;font-size:14px;cursor:pointer;color:#2a3342;font-weight:500;}
.bp-tab-active{background:#2f5cad;color:#fff;border-color:#2f5cad;}
.bp-new-btn{margin-left:auto;padding:9px 20px;border-radius:8px;background:#2f5cad;color:#fff;border:none;font-size:15px;font-weight:600;cursor:pointer;white-space:nowrap;}
.bp-table-card{background:#fff;border:1px solid #dce2ec;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);}
.bp-table{width:100%;border-collapse:collapse;}
.bp-table th,.bp-table td{padding:13px 16px;border-bottom:1px solid #e8edf5;font-size:14px;color:#253041;vertical-align:middle;}
.bp-table th{background:#f4f6fb;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.4px;color:#5a6478;}
.bp-table tbody tr:hover{background:#f9fafc;}
.bp-table tbody tr:last-child td{border-bottom:none;}
.bp-empty{text-align:center;padding:48px;color:#8492a6;}
.bp-empty-icon{font-size:40px;margin-bottom:10px;}
.bp-actions{display:flex;gap:6px;flex-wrap:wrap;}
.bp-btn{padding:5px 12px;border-radius:6px;border:1px solid #d0d7e3;background:#f5f7fb;font-size:13px;cursor:pointer;font-weight:500;transition:all .15s;}
.bp-btn:hover{filter:brightness(.95);}
.bp-btn-view{background:#e8f0fe;color:#1a56db;border-color:#c3d4f8;}
.bp-btn-edit{background:#fff8e1;color:#b45309;border-color:#fcd34d;}
.bp-btn-cancel{background:#fef2f2;color:#dc2626;border-color:#fca5a5;}
.bp-btn-delete{background:#dc2626;color:#fff;border-color:#dc2626;}
.bp-btn-review{background:#2f5cad;color:#fff;border-color:#2f5cad;}
.bp-pager{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:16px;color:#5a6478;font-size:14px;}
.bp-pager button{padding:6px 16px;border-radius:6px;border:1px solid #cfd6e1;background:#fff;cursor:pointer;font-size:14px;}
.bp-pager button:disabled{opacity:.45;cursor:default;}
.bp-detail-row{display:flex;gap:8px;margin-bottom:6px;font-size:14px;}
.bp-detail-label{color:#6b7280;min-width:90px;font-weight:500;}
.bp-detail-value{color:#111827;}
@media(max-width:1100px){.bp-page{grid-template-columns:1fr}.bp-sidebar{display:none}}
`;

const STATUS_COLORS = { PENDING:'warning', APPROVED:'success', REJECTED:'danger', CANCELLED:'secondary' };
const STATUS_ICONS  = { PENDING:'⏳', APPROVED:'✅', REJECTED:'❌', CANCELLED:'🚫' };

const emptyForm = { resourceId:'', bookingDate:'', startTime:'', endTime:'', purpose:'' };

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function BookingsPage() {
  const navigate  = useNavigate();
  const isAdmin   = authAPI.isAdmin();

  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalItems,  setTotalItems]  = useState(0);
  const [activeTab,   setActiveTab]   = useState('all');

  const [resources,   setResources]   = useState([]);

  // Modals
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'view' | 'status'
  const [selected, setSelected] = useState(null);

  const [form,       setForm]       = useState(emptyForm);
  const [statusForm, setStatusForm] = useState({ status:'APPROVED', adminNote:'' });
  const [saving,     setSaving]     = useState(false);

  /* ── fetch ── */
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        const s = activeTab === 'all' ? null : activeTab;
        res = await bookingAPI.getAllBookings(page, 10, s);
      } else {
        res = await bookingAPI.getMyBookings(page, 10);
      }
      const d = res.data;
      setBookings(d.content || []);
      setTotalPages(d.totalPages || 1);
      setTotalItems(d.totalElements || 0);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message;
      toast.error(`Failed to load bookings: ${msg || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, isAdmin]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  /* ── load available resources for form ── */
  const loadResources = async () => {
    try {
      const res = await resourceAPI.getAvailableResources();
      setResources(res.data || []);
    } catch {
      toast.error('Failed to load resources');
    }
  };

  /* ── open modals ── */
  const openCreate = async () => {
    await loadResources();
    setForm(emptyForm);
    setModal('create');
  };

  const openEdit = async (b) => {
    await loadResources();
    setSelected(b);
    setForm({
      resourceId:  b.resourceId,
      bookingDate: b.bookingDate,
      startTime:   b.startTime,
      endTime:     b.endTime,
      purpose:     b.purpose || '',
    });
    setModal('edit');
  };

  const openView = (b) => { setSelected(b); setModal('view'); };

  const openStatus = (b) => {
    setSelected(b);
    setStatusForm({ status:'APPROVED', adminNote:'' });
    setModal('status');
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  /* ── CRUD handlers ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await bookingAPI.createBooking(form);
      toast.success('Booking request submitted!');
      closeModal();
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create booking');
    } finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await bookingAPI.updateBooking(selected.id, form);
      toast.success('Booking updated!');
      closeModal();
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update booking');
    } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancelBooking(id);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this booking?')) return;
    try {
      await bookingAPI.deleteBooking(id);
      toast.success('Booking deleted');
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await bookingAPI.updateBookingStatus(selected.id, statusForm);
      toast.success(`Booking ${statusForm.status.toLowerCase()}!`);
      closeModal();
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally { setSaving(false); }
  };

  /* ── helpers ── */
  const tabs = isAdmin ? ['all','PENDING','APPROVED','REJECTED','CANCELLED'] : [];
  const from = totalItems === 0 ? 0 : page * 10 + 1;
  const to   = Math.min((page + 1) * 10, totalItems);

  const BookingForm = ({ onSubmit, title, submitLabel }) => (
    <Modal show onHide={closeModal} size="lg">
      <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Resource <span className="text-danger">*</span></Form.Label>
            <Form.Select required value={form.resourceId}
              onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))}>
              <option value="">Select a resource...</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.location} (cap: {r.capacity})</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Date <span className="text-danger">*</span></Form.Label>
            <Form.Control type="date" required value={form.bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, bookingDate: e.target.value }))} />
          </Form.Group>
          <div className="d-flex gap-3">
            <Form.Group className="mb-3 flex-fill">
              <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
              <Form.Control type="time" required value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3 flex-fill">
              <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
              <Form.Control type="time" required value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </Form.Group>
          </div>
          <Form.Group>
            <Form.Label>Purpose</Form.Label>
            <Form.Control as="textarea" rows={2} placeholder="Reason for booking..."
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : submitLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="bp-page">
      <style>{styles}</style>

      <OperationsSidebar activeKey="my-bookings" />

      {/* Main */}
      <section className="bp-main">
        <header className="bp-topbar">
          <h1>Bookings {totalItems > 0 && <small style={{fontSize:16,color:'#6b7280',fontWeight:400}}>({totalItems} total)</small>}</h1>
          <TopbarUserMenu containerClassName="bp-user-menu" logoutButtonClassName="bp-logout-btn" />
        </header>

        <div className="bp-content">
          {/* Toolbar */}
          <div className="bp-toolbar">
            {tabs.map(t => (
              <button key={t}
                className={`bp-tab ${activeTab === t ? 'bp-tab-active' : ''}`}
                onClick={() => { setActiveTab(t); setPage(0); }}>
                {STATUS_ICONS[t] || '📋'} {t === 'all' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
            <button className="bp-new-btn" onClick={openCreate}>+ New Booking</button>
          </div>

          {/* Table */}
          <div className="bp-table-card">
            {loading ? (
              <div className="bp-empty"><Spinner animation="border" /></div>
            ) : bookings.length === 0 ? (
              <div className="bp-empty">
                <div className="bp-empty-icon">📭</div>
                <div>No bookings found</div>
              </div>
            ) : (
              <table className="bp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Resource</th>
                    {isAdmin && <th>Requested By</th>}
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b.id}>
                      <td style={{color:'#9ca3af',fontSize:13}}>{from + i}</td>
                      <td><strong>{b.resourceName}</strong></td>
                      {isAdmin && <td>{b.username}</td>}
                      <td>{b.bookingDate}</td>
                      <td style={{whiteSpace:'nowrap'}}>{b.startTime} – {b.endTime}</td>
                      <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {b.purpose || <span style={{color:'#9ca3af'}}>—</span>}
                      </td>
                      <td>
                        <Badge bg={STATUS_COLORS[b.status] || 'secondary'}>
                          {STATUS_ICONS[b.status]} {b.status}
                        </Badge>
                        {b.adminNote && (
                          <div style={{fontSize:11,color:'#6b7280',marginTop:3}}>
                            Note: {b.adminNote}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="bp-actions">
                          {/* View */}
                          <button className="bp-btn bp-btn-view" onClick={() => openView(b)}>
                            👁 View
                          </button>
                          {/* Edit - user own PENDING only */}
                          {!isAdmin && b.status === 'PENDING' && (
                            <button className="bp-btn bp-btn-edit" onClick={() => openEdit(b)}>
                              ✏️ Edit
                            </button>
                          )}
                          {/* Admin review PENDING */}
                          {isAdmin && b.status === 'PENDING' && (
                            <button className="bp-btn bp-btn-review" onClick={() => openStatus(b)}>
                              🔍 Review
                            </button>
                          )}
                          {/* Cancel - user own PENDING */}
                          {!isAdmin && b.status === 'PENDING' && (
                            <button className="bp-btn bp-btn-cancel" onClick={() => handleCancel(b.id)}>
                              🚫 Cancel
                            </button>
                          )}
                          {/* Delete - admin only */}
                          {isAdmin && (
                            <button className="bp-btn bp-btn-delete" onClick={() => handleDelete(b.id)}>
                              🗑 Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="bp-pager">
            <span>{from}–{to} of {totalItems}</span>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{padding:'0 4px'}}>{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      </section>

      {/* ── Create Modal ── */}
      {modal === 'create' && (
        <BookingForm onSubmit={handleCreate} title="New Booking Request" submitLabel="Submit Request" />
      )}

      {/* ── Edit Modal ── */}
      {modal === 'edit' && (
        <BookingForm onSubmit={handleEdit} title="Edit Booking" submitLabel="Save Changes" />
      )}

      {/* ── View Modal ── */}
      {modal === 'view' && selected && (
        <Modal show onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>Booking Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{background:'#f9fafb',borderRadius:8,padding:16,marginBottom:12}}>
              <Badge bg={STATUS_COLORS[selected.status]} style={{fontSize:14,marginBottom:10}}>
                {STATUS_ICONS[selected.status]} {selected.status}
              </Badge>
              {[
                ['Resource',    selected.resourceName],
                ['Requested By',selected.username],
                ['Date',        selected.bookingDate],
                ['Time',        `${selected.startTime} – ${selected.endTime}`],
                ['Purpose',     selected.purpose || '—'],
                ['Admin Note',  selected.adminNote || '—'],
                ['Created',     selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'],
                ['Updated',     selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '—'],
              ].map(([label, value]) => (
                <div className="bp-detail-row" key={label}>
                  <span className="bp-detail-label">{label}</span>
                  <span className="bp-detail-value">{value}</span>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>Close</Button>
            {!isAdmin && selected.status === 'PENDING' && (
              <>
                <Button variant="warning" onClick={() => { closeModal(); openEdit(selected); }}>✏️ Edit</Button>
                <Button variant="danger" onClick={() => { closeModal(); handleCancel(selected.id); }}>🚫 Cancel</Button>
              </>
            )}
            {isAdmin && selected.status === 'PENDING' && (
              <Button variant="primary" onClick={() => { closeModal(); openStatus(selected); }}>🔍 Review</Button>
            )}
            {isAdmin && (
              <Button variant="danger" onClick={() => { closeModal(); handleDelete(selected.id); }}>🗑 Delete</Button>
            )}
          </Modal.Footer>
        </Modal>
      )}

      {/* ── Admin Status Modal ── */}
      {modal === 'status' && selected && (
        <Modal show onHide={closeModal}>
          <Modal.Header closeButton><Modal.Title>Review Booking</Modal.Title></Modal.Header>
          <Form onSubmit={handleStatusUpdate}>
            <Modal.Body>
              <div style={{background:'#f0f4ff',borderRadius:8,padding:14,marginBottom:16}}>
                <strong>{selected.resourceName}</strong><br />
                <small style={{color:'#4b5563'}}>
                  {selected.username} · {selected.bookingDate} · {selected.startTime}–{selected.endTime}
                </small>
                {selected.purpose && <><br /><small>Purpose: {selected.purpose}</small></>}
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Decision</Form.Label>
                <Form.Select value={statusForm.status}
                  onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="APPROVED">✅ Approve</option>
                  <option value="REJECTED">❌ Reject</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Note for user (optional)</Form.Label>
                <Form.Control as="textarea" rows={2}
                  placeholder="Add a note..."
                  value={statusForm.adminNote}
                  onChange={e => setStatusForm(f => ({ ...f, adminNote: e.target.value }))} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={saving}
                variant={statusForm.status === 'APPROVED' ? 'success' : 'danger'}>
                {saving
                  ? <Spinner size="sm" animation="border" />
                  : statusForm.status === 'APPROVED' ? '✅ Approve' : '❌ Reject'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </div>
  );
}
