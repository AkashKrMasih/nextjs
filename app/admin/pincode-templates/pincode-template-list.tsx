'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PincodeTemplateModal, type PincodeTemplateRow } from './pincode-template-modal';

export function PincodeTemplateList({ templates }: { templates: PincodeTemplateRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(templates);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PincodeTemplateRow | null>(null);
  const [error, setError] = useState('');

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(template: PincodeTemplateRow) {
    setEditing(template);
    setModalOpen(true);
  }

  async function handleDelete(template: PincodeTemplateRow) {
    const confirmed = window.confirm(`Delete template "${template.title}"?`);
    if (!confirmed) return;

    setError('');
    const response = await fetch(`/api/pincode-templates/${template.id}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error ?? 'Could not delete template');
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== template.id));
    router.refresh();
  }

  function handleSaved(template: PincodeTemplateRow) {
    setItems((current) => {
      const index = current.findIndex((entry) => entry.id === template.id);
      if (index === -1) return [...current, template].sort((a, b) => a.title.localeCompare(b.title));
      const next = [...current];
      next[index] = { ...next[index], ...template };
      return next;
    });
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          New template
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-gray-500">No pincode templates yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-3 py-2.5 font-medium text-gray-500">Title</th>
                <th className="px-3 py-2.5 font-medium text-gray-500">Pincodes</th>
                <th className="px-3 py-2.5 font-medium text-gray-500">Products</th>
                <th className="px-3 py-2.5 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((template) => (
                <tr key={template.id} className="border-b border-gray-100 align-top last:border-0">
                  <td className="px-3 py-3 font-medium text-gray-900">{template.title}</td>
                  <td className="px-3 py-3 text-gray-600">
                    <p className="line-clamp-2">{template.pincodes.join(', ')}</p>
                    <p className="mt-1 text-xs text-gray-400">{template.pincodes.length} total</p>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{template.productCount ?? 0}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(template)}
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template)}
                      className="ml-3 text-sm font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PincodeTemplateModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
