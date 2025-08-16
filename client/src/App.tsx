import React, { useEffect, useMemo, useState } from 'react';
import { Concept, deleteConcept, fetchConcepts, getConcept, updateContent, updateDescription, updateTitle } from './api';
import { Modal } from './components/Modal';
import { Toast } from './components/Toast';
import { fmt } from './utils';
import { CreateConceptModal } from './components/CreateConceptModal';

export default function App() {
  const [items, setItems] = useState<Concept[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<Concept | null>(null);
  const [edit, setEdit] = useState<Concept | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState<boolean>(false);

  useEffect(() => { refresh(); }, []);

  function showToast(msg: string, ms = 2000) {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), ms);
  }

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchConcepts();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load concepts');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(x => (x.title?.toLowerCase().includes(q) || x.description?.toLowerCase().includes(q)));
  }, [items, search]);

  

  return (
    <div>
      <header>
        <div className="container">
          <div className="header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt="Concept Design Library" style={{ width: '64px', height: '64px' }} />
              <h1>Concept Design Library</h1>
            </div>
            <button type="button" className="btn primary" onClick={() => setShowCreate(true)}>Add New Concept</button>
          </div>
        </div>
      </header>
      <main className="container">
        
        <section>
          <div className="row searchbar">
            <div className="search-input-wrap">
              <input value={search} onChange={(e) => setSearch(e.target.value)} id="search" placeholder="Search title or description..." />
              {search && (
                <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setSearch('')}>×</button>
              )}
            </div>
          </div>
          <div className="muted small" style={{ marginBottom: 8 }}>Showing <b id="count">{filtered.length}</b> {filtered.length === 1 ? 'concept' : 'concepts'}</div>
          {loading ? (
            <div className="loading-center"><span className="spinner" />Loading...</div>
          ) : (
            <div className="list" id="list">
              {filtered.map(item => (
                <Card
                  key={item.concept}
                  item={item}
                  loading={loadingId === item.concept}
                  onView={async () => {
                    setLoadingId(item.concept);
                    try {
                      const rec = await getConcept(item.concept);
                      setView(rec);
                    } catch {
                      setView(item);
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                  onEdit={async () => setEdit(await getConcept(item.concept).catch(() => item))}
                  onCopy={() => { navigator.clipboard.writeText(item.concept).then(() => showToast('ID copied')); }}
                  onDelete={async () => { if (!confirm('Delete this concept?')) return; await deleteConcept(item.concept); showToast('Deleted'); refresh(); }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreate && (
        <CreateConceptModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refresh(); showToast('Created'); }}
          onError={(msg: string) => showToast(msg)}
        />
      )}

      {view && (
        <Modal title={view.title} onClose={() => setView(null)}>
          <div className="muted small">Created: {fmt(view.createdAt)}{/* {view.updatedAt ? ` | Updated: ${fmt(view.updatedAt)}` : ''} */}</div>
          <pre className="code">{view.content || '(no content)'}</pre>
        </Modal>
      )}

      {edit && (
        <EditModal rec={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); refresh(); showToast('Saved'); }} />
      )}

      <Toast message={toast} />
    </div>
  );
}

function Card({ item, onView, onEdit, onCopy, onDelete, loading }: { item: Concept; onView: () => void; onEdit: () => void; onCopy: () => void; onDelete: () => void; loading?: boolean; }) {
  return (
    <div className="card">
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{item.title}</h2>
        {/* <small className="muted">{fmt(item.createdAt)}</small> */}
      </div>
      <h3 className="muted">{item.description}</h3>
      {item.content && (
        <div className="content-preview" onClick={onView} style={{ cursor: 'pointer' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.content}</pre>
        </div>
      )}
      <div className="actions">
        <button type="button" className="btn secondary large" onClick={onView} disabled={!!loading}>
          {loading ? 'Loading...' : 'View'}
        </button>
        {/* <button type="button" className="btn secondary" onClick={onEdit}>Edit</button>
        <button type="button" className="btn secondary" onClick={onCopy}>Copy ID</button>
        <button type="button" className="btn danger" onClick={onDelete}>Delete</button> */}
      </div>
    </div>
  );
}

function EditModal({ rec, onClose, onSaved }: { rec: Concept; onClose: () => void; onSaved: () => void; }) {
  const [title, setTitle] = useState(rec.title || '');
  const [desc, setDesc] = useState(rec.description || '');
  const [content, setContent] = useState(rec.content || '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ops: Promise<any>[] = [];
    if (title.trim() !== (rec.title || '')) ops.push(updateTitle(rec.concept, title.trim()));
    if (desc.trim() !== (rec.description || '')) ops.push(updateDescription(rec.concept, desc.trim()));
    if (content !== (rec.content || '')) ops.push(updateContent(rec.concept, content));
    if (ops.length) await Promise.all(ops);
    onSaved();
  }

  return (
    <Modal title={`Edit: ${rec.title}`} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="actions" style={{ marginTop: 8 }}>
          <button type="submit" className="btn primary">Save</button>
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
