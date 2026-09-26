'use client';

import { useEffect, useState } from 'react';
import { PRODUCT_REPORT_REASONS } from '@/lib/product-report-reasons';

export function ProductReportDialog({
  productId,
  isLoggedIn,
}: {
  productId: number;
  isLoggedIn: boolean;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>(PRODUCT_REPORT_REASONS[0]);
  const [reportMessage, setReportMessage] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);

  useEffect(() => {
    if (!reportOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setReportOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reportOpen]);

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    setReportSaving(true);
    setReportError(null);
    const formData = new FormData();
    formData.set('productId', String(productId));
    formData.set('reason', reportReason);
    formData.set('message', reportMessage);
    const response = await fetch('/api/product-reports', { method: 'POST', body: formData });
    const payload = await response.json().catch(() => ({}));
    setReportSaving(false);
    if (!response.ok) {
      setReportError(payload.error ?? 'Could not send report');
      return;
    }
    setReportSent(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setReportOpen(true);
          setReportSent(false);
          setReportError(null);
        }}
        className="text-sm text-stone-500 underline hover:text-stone-900"
      >
        Report
      </button>

      {reportOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center"
          onClick={() => setReportOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="report-title"
            className="w-full max-w-md rounded-lg border border-stone-300 bg-white p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="report-title" className="text-lg text-stone-900">Report this product</h2>
            {isLoggedIn ? (
              reportSent ? (
                <p className="mt-3 text-sm text-green-800">Report sent.</p>
              ) : (
                <form onSubmit={submitReport} className="mt-4 space-y-3">
                  <label className="block text-sm text-stone-600">
                    Reason
                    <select
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-stone-900"
                    >
                      {PRODUCT_REPORT_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-stone-600">
                    Message
                    <textarea
                      required
                      rows={4}
                      value={reportMessage}
                      onChange={(event) => setReportMessage(event.target.value)}
                      className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-stone-900"
                    />
                  </label>
                  {reportError ? <p className="text-sm text-red-700">{reportError}</p> : null}
                  <button
                    type="submit"
                    disabled={reportSaving}
                    className="rounded bg-green-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {reportSaving ? 'Sending…' : 'Send report'}
                  </button>
                </form>
              )
            ) : (
              <p className="mt-3 text-sm text-stone-700">only logged in user can report</p>
            )}
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="mt-4 text-sm text-stone-500 hover:text-stone-900"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
