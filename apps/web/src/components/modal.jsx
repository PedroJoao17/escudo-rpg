'use client';
import { useEffect, useRef } from 'react';

export default function Modal({ title, onClose, children, size = 'default' }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`modal ${size === 'wide' ? 'modal-wide' : ''}`} aria-labelledby="modal-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-heading"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">×</button></div>
    {children}
  </dialog>;
}
