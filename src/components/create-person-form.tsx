"use client";

import { useState } from "react";

import { createPersonAction } from "@/app/actions";

type PersonDraft = {
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  linkedinUrl: string;
  twitterUrl: string;
  redditUrl: string;
  resume: string;
  notes: string;
};

const emptyDraft: PersonDraft = {
  fullName: "",
  companyName: "",
  email: "",
  phoneNumber: "",
  linkedinUrl: "",
  twitterUrl: "",
  redditUrl: "",
  resume: "",
  notes: ""
};

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder
}: {
  label: string;
  name: keyof PersonDraft;
  type?: string;
  value: string;
  onChange: (name: keyof PersonDraft, value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
      <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</span>
      <input
        className="app-input"
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

export function CreatePersonForm({
  variant = "panel"
}: {
  variant?: "panel" | "embedded";
}) {
  const [draft, setDraft] = useState<PersonDraft>(emptyDraft);

  function updateField(name: keyof PersonDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [name]: value
    }));
  }

  const wrapperClassName = variant === "embedded" ? "space-y-4 p-4 md:p-5" : "app-panel space-y-4 p-4 md:p-5";

  return (
    <form action={createPersonAction} className={wrapperClassName}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" name="fullName" onChange={updateField} placeholder="Ada Lovelace" value={draft.fullName} />
        <Field
          label="Company name"
          name="companyName"
          onChange={updateField}
          placeholder="Analytical Engines Inc."
          value={draft.companyName}
        />
        <Field label="Email" name="email" onChange={updateField} placeholder="ada@example.com" type="email" value={draft.email} />
        <Field
          label="Phone number"
          name="phoneNumber"
          onChange={updateField}
          placeholder="+1 555 123 4567"
          value={draft.phoneNumber}
        />
        <Field
          label="LinkedIn profile"
          name="linkedinUrl"
          onChange={updateField}
          placeholder="https://linkedin.com/in/..."
          type="url"
          value={draft.linkedinUrl}
        />
        <Field
          label="Twitter profile"
          name="twitterUrl"
          onChange={updateField}
          placeholder="https://x.com/..."
          type="url"
          value={draft.twitterUrl}
        />
        <Field
          label="Reddit profile"
          name="redditUrl"
          onChange={updateField}
          placeholder="https://reddit.com/u/..."
          type="url"
          value={draft.redditUrl}
        />
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
        <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Resume</span>
        <textarea
          className="app-textarea"
          name="resume"
          onChange={(event) => updateField("resume", event.target.value)}
          placeholder="Short profile summary from LinkedIn, Twitter/X, or your own research."
          value={draft.resume}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
        <span className="text-xs text-white/50">Notes</span>
        <textarea
          className="app-textarea"
          name="notes"
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Manual CRM notes, objections, reminders, warm intro details, or next-step context."
          value={draft.notes}
        />
      </label>

      <button className="app-button" type="submit">
        Create person
      </button>
    </form>
  );
}
