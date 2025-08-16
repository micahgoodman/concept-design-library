import React from 'react';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ title, onClose, children }: Props) {
  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button type="button" className="modal-close-btn" aria-label="Close modal" onClick={onClose}>×</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
