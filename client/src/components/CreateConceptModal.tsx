import React, { useState } from 'react';
import { Modal } from './Modal';
import { buildConceptSpec } from '../utils';
import { createConcept } from '../api';

export function CreateConceptModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: () => void; onError: (msg: string) => void; }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cName, setCName] = useState('');
  const [cPurpose, setCPurpose] = useState('');
  const [cState, setCState] = useState('');
  const [cActions, setCActions] = useState('');
  const [cQueries, setCQueries] = useState('');
  const [cOperational, setCOperational] = useState('');
  const [creating, setCreating] = useState(false);

  function loadSample() {
    setTitle('Sample Concept');
    setDescription('An example concept spec template.');
    setCName('Example');
    setCPurpose('to demonstrate a reusable concept entry');
    setCState('a set of Examples with\n    a example String\n    a title String\n    a createdAt String');
    setCActions('create (example: String, title: String) : (example: String)\n    create a new example record');
    setCOperational('after create (example: x, title: "Sample Concept") : (example: x)\n    for any example e such that e\'s title is "Sample Concept", e must be x');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    const n = cName.trim();
    const p = cPurpose;
    const s = cState;
    const a = cActions;
    const q = cQueries;
    const o = cOperational;
    if (!t || !d || !n || !p || !s || !a) return;
    const content = buildConceptSpec({ name: n, purpose: p, state: s, actions: a, queries: q, operational: o });
    try {
      setCreating(true);
      await createConcept({ title: t, description: d, content });
      onCreated();
    } catch (err) {
      console.error(err);
      onError('Failed to create. Is the API running?');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal title="Add New Concept" onClose={onClose}>
      <form onSubmit={onSubmit} id="create-form">
        <div className="row">
          <input name="title" placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="button" id="load-sample" className="btn secondary" onClick={loadSample}>Show example</button>
        </div>
        <textarea name="description" placeholder="Description" required value={description} onChange={(e) => setDescription(e.target.value)} />
        <input name="c_name" placeholder="Concept name (e.g. User)" required value={cName} onChange={(e) => setCName(e.target.value)} />
        <textarea name="c_purpose" placeholder="Purpose" required value={cPurpose} onChange={(e) => setCPurpose(e.target.value)} />
        <textarea name="c_state" placeholder="State (SSF)" required value={cState} onChange={(e) => setCState(e.target.value)} />
        <textarea name="c_actions" placeholder="Actions (SSF)" required value={cActions} onChange={(e) => setCActions(e.target.value)} />
        <textarea name="c_queries" placeholder="Queries (optional, SSF)" value={cQueries} onChange={(e) => setCQueries(e.target.value)} />
        <textarea name="c_operational" placeholder="Operational principle" value={cOperational} onChange={(e) => setCOperational(e.target.value)} />
        <div className="actions" style={{ marginTop: 8 }}>
          <button type="button" className="btn cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn confirm" disabled={creating}>
            {creating && <span className="spinner" />}
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
