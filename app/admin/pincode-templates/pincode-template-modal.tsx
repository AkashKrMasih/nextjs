'use client';

import { useEffect, useState } from 'react';

export type PincodeTemplateRow = {
  id: string;
  title: string;
  pincodes: string[];
  productCount?: number;
};

type PincodeTemplateModalProps = {
  open: boolean;
  initial: PincodeTemplateRow | null;
  onClose: () => void;
  onSaved: (template: PincodeTemplateRow) => void;
};

export function PincodeTemplateModal({
  open,
  initial,
  onClose,
  onSaved,
}: PincodeTemplateModalProps) {
  const [title, setTitle] = useState('');
  const [pincodesText, setPincodesText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setPincodesText(initial?.pincodes?.join(', ') ?? '');
    setError('');
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError('');

    const response = await fetch(
      initial ? `/api/pincode-templates/${initial.id}` : '/api/pincode-templates',
      {
        method: initial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, pincodes: pincodesText }),
      }
    );
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not save template');
      return;
    }

    onSaved({
      id: payload.id,
      title: payload.title,
      pincodes: payload.pincodes,
      productCount: initial?.productCount ?? 0,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pincode-template-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="pincode-template-title" className="text-lg font-medium text-gray-900">
          {initial ? 'Edit pincode template' : 'Pincode template'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Add a title and list pincodes separated by commas or new lines.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="template-title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="template-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              placeholder="e.g. Metro delivery zone"
              required
            />
          </div>

          <div>
            <label htmlFor="template-pincodes" className="block text-sm font-medium text-gray-700">
              Pincodes
            </label>
            <textarea
              id="template-pincodes"
              value={pincodesText}
              onChange={(event) => setPincodesText(event.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              placeholder="110001, 110002, 400001"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
