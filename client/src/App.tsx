import React, { useEffect, useMemo, useState } from 'react';
import { Concept, createConcept, deleteConcept, fetchConcepts, getConcept, updateContent, updateDescription, updateTitle } from './api';
import { Modal } from './components/Modal';
import { Toast } from './components/Toast';
import { buildConceptSpec, fmt } from './utils';

export default function App() {
  const [items, setItems] = useState<Concept[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<Concept | null>(null);
  const [edit, setEdit] = useState<Concept | null>(null);

  useEffect(() => { refresh(); }, []);

  function showToast(msg: string, ms = 2000) {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), ms);
  }

  async function refresh() {
    const data = await fetchConcepts();
    setItems(data);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(x => (x.title?.toLowerCase().includes(q) || x.description?.toLowerCase().includes(q)));
  }, [items, search]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement; // capture before any await
    const f = new FormData(formEl);
    const title = String(f.get('title') || '').trim();
    const description = String(f.get('description') || '').trim();
    const c_name = String(f.get('c_name') || '').trim();
    const c_purpose = String(f.get('c_purpose') || '');
    const c_state = String(f.get('c_state') || '');
    const c_actions = String(f.get('c_actions') || '');
    const c_operational = String(f.get('c_operational') || '');
    if (!title || !description || !c_name || !c_purpose || !c_state || !c_actions) return;
    const content = buildConceptSpec({ name: c_name, purpose: c_purpose, state: c_state, actions: c_actions, operational: c_operational });
    try {
      await createConcept({ title, description, content });
      formEl.reset();
      showToast('Created');
      refresh();
    } catch (err) {
      console.error(err);
      showToast('Failed to create. Is the API running?');
    }
  }

  function loadSample(form: HTMLFormElement | null) {
    if (!form) return;
    (form.querySelector('[name="title"]') as HTMLInputElement).value = 'Sample Concept';
    (form.querySelector('[name="description"]') as HTMLTextAreaElement).value = 'An example concept spec template.';
    (form.querySelector('[name="c_name"]') as HTMLInputElement).value = 'Example';
    (form.querySelector('[name="c_purpose"]') as HTMLTextAreaElement).value = 'to demonstrate a reusable concept entry';
    (form.querySelector('[name="c_state"]') as HTMLTextAreaElement).value = 'a set of Examples with\n    a example String\n    a title String\n    a createdAt String';
    (form.querySelector('[name="c_actions"]') as HTMLTextAreaElement).value = 'create (example: String, title: String) : (example: String)\n    create a new example record';
    (form.querySelector('[name="c_operational"]') as HTMLTextAreaElement).value = 'after create (example: x, title: "Sample Concept") : (example: x)\n    for any example e such that e\'s title is "Sample Concept", e must be x';
  }

  return (
    <div>
      <header>
        <div className="container">
          <h1>Concept Design Library</h1>
        </div>
      </header>
      <main className="container">
        <section>
          <form onSubmit={onCreate} id="create-form">
            <div className="row">
              <input name="title" placeholder="Title" required />
              <button type="button" id="load-sample" className="btn secondary" onClick={(e) => loadSample((e.currentTarget.closest('form') as HTMLFormElement))}>Show example</button>
            </div>
            <textarea name="description" placeholder="Description" required />
            <input name="c_name" placeholder="Concept name (e.g. User)" required />
            <textarea name="c_purpose" placeholder="Purpose" required />
            <textarea name="c_state" placeholder="State (SSF)" required />
            <textarea name="c_actions" placeholder="Actions (SSF)" required />
            <textarea name="c_operational" placeholder="Operational principle" />
            <button type="submit">Create</button>
          </form>
        </section>
        <section>
          <div className="row searchbar">
            <input value={search} onChange={(e) => setSearch(e.target.value)} id="search" placeholder="Search title or description..." />
            <button className="btn secondary" type="button" onClick={() => setSearch('')}>Clear</button>
          </div>
          <div className="muted small" style={{ marginBottom: 8 }}>Showing <b id="count">{filtered.length}</b> concepts</div>
          <div className="list" id="list">
            {filtered.map(item => (
              <Card key={item.concept} item={item} onView={async () => setView(await getConcept(item.concept).catch(() => item))} onEdit={async () => setEdit(await getConcept(item.concept).catch(() => item))} onCopy={() => { navigator.clipboard.writeText(item.concept).then(() => showToast('ID copied')); }} onDelete={async () => { if (!confirm('Delete this concept?')) return; await deleteConcept(item.concept); showToast('Deleted'); refresh(); }} />
            ))}
          </div>
        </section>
      </main>

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

function Card({ item, onView, onEdit, onCopy, onDelete }: { item: Concept; onView: () => void; onEdit: () => void; onCopy: () => void; onDelete: () => void; }) {
  return (
    <div className="card">
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>{item.title}</h4>
        <small className="muted">{fmt(item.createdAt)}</small>
      </div>
      <p className="muted">{item.description}</p>
      <div className="actions">
        <button type="button" className="btn primary large" onClick={onView}>View</button>
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
