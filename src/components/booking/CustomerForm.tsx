"use client";

export type CustomerFormValue = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
};

type CustomerFormProps = {
  value: CustomerFormValue;
  onChange: (next: CustomerFormValue) => void;
};

const fieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-[14px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5";

export function CustomerForm({ value, onChange }: CustomerFormProps) {
  function patch(partial: Partial<CustomerFormValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            First name *
          </span>
          <input
            className={fieldClass}
            value={value.firstName}
            onChange={(e) => patch({ firstName: e.target.value })}
            autoComplete="given-name"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Last name *
          </span>
          <input
            className={fieldClass}
            value={value.lastName}
            onChange={(e) => patch({ lastName: e.target.value })}
            autoComplete="family-name"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Phone *
        </span>
        <input
          className={fieldClass}
          value={value.phone}
          onChange={(e) => patch({ phone: e.target.value })}
          autoComplete="tel"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Email *
        </span>
        <input
          type="email"
          className={fieldClass}
          value={value.email}
          onChange={(e) => patch({ email: e.target.value })}
          autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Notes
        </span>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5"
          value={value.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>
    </div>
  );
}
