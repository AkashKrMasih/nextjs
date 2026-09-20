'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { createAddress, deleteAddress, setDefaultAddress, updateAddress } from './actions';

export type Address = {
  id: string;
  label: string | null;
  name: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const emptyFormState = undefined;

export function AddressManager({
  userId,
  initialAddresses,
}: {
  userId: string;
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  function handleDelete(address: Address) {
    if (!confirm(`Delete the "${address.label || address.name}" address?`)) return;
    setPendingId(address.id);
    startTransition(async () => {
      await deleteAddress(userId, address.id);
      setPendingId(null);
    });
  }

  function handleSetDefault(address: Address) {
    setPendingId(address.id);
    startTransition(async () => {
      await setDefaultAddress(userId, address.id);
      setPendingId(null);
    });
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#55624A]">
          {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
        </h2>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-md bg-[#1E1B16] px-4 py-2 text-sm font-medium text-[#FAF8F3] transition-colors hover:bg-[#33302A]"
        >
          Add address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[#D8D2C4] px-6 py-10 text-center">
          <p className="text-sm text-[#55624A]">You haven&apos;t saved any addresses yet.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col justify-between rounded-lg border border-[#D8D2C4] bg-[#FAF8F3] p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1E1B16]">
                    {address.label || 'Address'}
                  </span>
                  {address.isDefault && (
                    <span className="rounded-full bg-[#EFE9DC] px-2 py-0.5 text-xs text-[#55624A]">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-sm text-[#55624A]">
                  <p>{address.name}</p>
                  <p>{address.address1}</p>
                  {address.address2 && <p>{address.address2}</p>}
                  <p>
                    {address.city}
                    {address.state ? `, ${address.state}` : ''} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                  {address.phone && <p className="mt-1">{address.phone}</p>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setEditing(address)}
                  className="text-[#55624A] hover:text-[#1E1B16]"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    disabled={isPending && pendingId === address.id}
                    onClick={() => handleSetDefault(address)}
                    className="text-[#55624A] hover:text-[#1E1B16] disabled:opacity-50"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending && pendingId === address.id}
                  onClick={() => handleDelete(address)}
                  className="text-red-700/80 hover:text-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <AddressFormModal
          key={editing === 'new' ? 'new' : editing.id}
          userId={userId}
          address={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function AddressFormModal({
  userId,
  address,
  onClose,
}: {
  userId: string;
  address: Address | null;
  onClose: () => void;
}) {
  const isEditing = address !== null;
  const action = isEditing
    ? updateAddress.bind(null, userId, address.id)
    : createAddress.bind(null, userId);

  const [state, formAction, isSubmitting] = useActionState(action, emptyFormState);
  const closedOnSuccess = useRef(false);
  const formSubmittedRef = useRef(false);

  // The action returns undefined on success and { error } on failure, so a
  // transition from "submitting" to "not submitting, no error" means it saved.
  useEffect(() => {
    if (!isSubmitting && !state?.error && !closedOnSuccess.current && formSubmittedRef.current) {
      closedOnSuccess.current = true;
      onClose();
    }
  }, [isSubmitting, state]);

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#D8D2C4] bg-[#FAF8F3] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#1E1B16]">
            {isEditing ? 'Edit address' : 'Add address'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#55624A] hover:text-[#1E1B16]"
          >
            ✕
          </button>
        </div>

        <form
          action={(formData) => {
            formSubmittedRef.current = true;
            formAction(formData);
          }}
          className="mt-4 space-y-3"
        >
          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <Field label="Label (optional)" name="label" defaultValue={address?.label ?? ''} placeholder="Home, Work…" />
          <Field label="Recipient name" name="name" defaultValue={address?.name ?? ''} required />
          <Field label="Phone (optional)" name="phone" defaultValue={address?.phone ?? ''} />
          <Field label="Address line 1" name="address1" defaultValue={address?.address1 ?? ''} required />
          <Field label="Address line 2 (optional)" name="address2" defaultValue={address?.address2 ?? ''} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="City" name="city" defaultValue={address?.city ?? ''} required />
            <Field label="State (optional)" name="state" defaultValue={address?.state ?? ''} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Postal code" name="postalCode" defaultValue={address?.postalCode ?? ''} required />
            <Field label="Country" name="country" defaultValue={address?.country ?? ''} required />
          </div>

          <label className="flex items-center gap-2 pt-1 text-sm text-[#55624A]">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked={address?.isDefault ?? false}
              disabled={address?.isDefault}
              className="h-4 w-4 rounded border-[#D8D2C4]"
            />
            Set as default address
          </label>

          <div className="mt-2 flex justify-end gap-3 border-t border-[#D8D2C4] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[#55624A] hover:text-[#1E1B16]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-[#1E1B16] px-4 py-2 text-sm font-medium text-[#FAF8F3] transition-colors hover:bg-[#33302A] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-[#55624A]">
      {label}
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-[#D8D2C4] bg-white px-3 py-2 text-sm text-[#1E1B16] outline-none focus:border-[#55624A]"
      />
    </label>
  );
}
