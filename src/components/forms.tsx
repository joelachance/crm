import Link from "next/link";

import {
  assignProductTagAction,
  createMessageTurnAction,
  createProductTagAction,
  deletePersonAction,
  removeProductTagAction,
  toggleArchiveAction,
  updateMessageTurnResponseAction,
  updatePersonAction,
  updateProductTagAction
} from "@/app/actions";
import type { MessageTurn, PersonDetail, PersonSummary, ProductTag } from "@/lib/types";
import { currentCentralDateTimeInputValue, localDateTimeInputValue, prettyDate, productTagColorStyles } from "@/lib/utils";

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
      <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</span>
      <input
        className="app-input"
        defaultValue={defaultValue ?? ""}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export function TagManager({ productTags }: { productTags: ProductTag[] }) {
  return (
    <section className="app-panel space-y-4 p-4 md:p-5">
      <div className="space-y-1">
        <h2 className="app-section-title">Product tags</h2>
        <p className="app-copy">Use these like product buckets, such as MemKit, and then attach them to people with an ICP status.</p>
      </div>

      <form action={createProductTagAction} className="flex flex-col gap-3 sm:flex-row">
        <input
          className="app-input min-w-0 flex-1"
          name="name"
          placeholder="MemKit"
          type="text"
        />
        <input className="h-11 w-14 border border-white/10 bg-[#050505] p-1" defaultValue="#7dd3fc" name="color" type="color" />
        <button className="app-button" type="submit">
          Add tag
        </button>
      </form>

      <div className="space-y-3">
        {productTags.length === 0 ? (
          <p className="border border-dashed border-white/10 px-4 py-5 text-sm text-white/38">No product tags yet.</p>
        ) : (
          productTags.map((tag) => (
            <form action={updateProductTagAction} className="flex flex-col gap-3 border border-white/10 bg-[#0a0a0a] p-4 sm:flex-row sm:items-center" key={tag.id}>
              <input name="tagId" type="hidden" value={tag.id} />
              <input
                className="app-input min-w-0 flex-1"
                defaultValue={tag.name}
                name="name"
                type="text"
              />
              <input className="h-11 w-14 border border-white/10 bg-[#050505] p-1" defaultValue={tag.color} name="color" type="color" />
              <button className="app-button-secondary" type="submit">
                Rename
              </button>
            </form>
          ))
        )}
      </div>
    </section>
  );
}

function AssignmentBadge({ name, color, isIcp }: { name: string; color: string; isIcp: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={productTagColorStyles(color)}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
      <span className="border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/56">
        {isIcp ? "ICP" : "Prospect"}
      </span>
    </span>
  );
}

function ContactLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="text-sm font-medium text-white/72 underline decoration-white/15 underline-offset-4 transition hover:text-white" href={href} rel="noreferrer" target="_blank">
      {label}
    </a>
  );
}

export function PeopleOverview({ people }: { people: PersonSummary[] }) {
  return (
    <section className="app-panel space-y-4 p-4 md:p-5">
      <div className="space-y-1">
        <h2 className="app-section-title">Customers</h2>
        <p className="app-copy">Each record shows contact channels, archive state, outreach count, and the current fit signals tied to that person.</p>
      </div>

      <div className="space-y-4">
        {people.length === 0 ? (
          <p className="border border-dashed border-white/10 px-4 py-5 text-sm text-white/38">No contacts yet. Add your first person to start building the CRM.</p>
        ) : (
          people.map((person) => (
            <article className="border border-white/10 bg-[#070707] p-4" key={person.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-white">{person.fullName}</h3>
                    {person.companyName ? (
                      <span className="font-mono-ui border border-white/10 bg-[#0d0d0d] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/58">
                        {person.companyName}
                      </span>
                    ) : null}
                    <span
                      className={`font-mono-ui border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        person.archived ? "border-white/10 bg-[#0d0d0d] text-white/45" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {person.archived ? "Archived" : "Active"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {person.email ? <ContactLink href={`mailto:${person.email}`} label={person.email} /> : null}
                    {person.phoneNumber ? <ContactLink href={`tel:${person.phoneNumber}`} label={person.phoneNumber} /> : null}
                    {person.linkedinUrl ? <ContactLink href={person.linkedinUrl} label="LinkedIn" /> : null}
                    {person.twitterUrl ? <ContactLink href={person.twitterUrl} label="Twitter" /> : null}
                    {person.redditUrl ? <ContactLink href={person.redditUrl} label="Reddit" /> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {person.productAssignments.length > 0 ? (
                      person.productAssignments.map((assignment) => (
                        <AssignmentBadge color={assignment.productTagColor} isIcp={assignment.isIcp} key={assignment.id} name={assignment.productTagName} />
                      ))
                    ) : (
                      <span className="border border-white/10 bg-[#0d0d0d] px-3 py-1 text-xs font-medium text-white/40">No product tags yet</span>
                    )}
                  </div>

                  {person.resume ? (
                    <p className="max-w-3xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm leading-6 text-white/68">{person.resume}</p>
                  ) : null}
                  {person.notes ? (
                    <p className="max-w-3xl border border-white/10 bg-[#050505] px-4 py-3 text-sm leading-6 text-white/46">{person.notes}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="border border-white/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-white/42">
                    {person.messageTurns.length} outreach turns
                  </span>
                  <form action={toggleArchiveAction}>
                    <input name="personId" type="hidden" value={person.id} />
                    <input name="archived" type="hidden" value={String(!person.archived)} />
                    <button className="app-button-secondary px-4 py-2" type="submit">
                      {person.archived ? "Restore" : "Archive"}
                    </button>
                  </form>
                  <Link
                    className="app-button px-4 py-2"
                    href={`/people/${person.id}`}
                  >
                    Open record
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function PersonEditor({ person }: { person: PersonDetail }) {
  return (
    <form action={updatePersonAction} className="app-panel space-y-4 p-4 md:p-5">
      <div className="space-y-1">
        <h2 className="app-section-title">Edit contact</h2>
        <p className="app-copy">Update the contact record and archive status in one place.</p>
      </div>

      <input name="personId" type="hidden" value={person.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field defaultValue={person.fullName} label="Full name" name="fullName" />
        <Field defaultValue={person.companyName} label="Company name" name="companyName" />
        <Field defaultValue={person.email} label="Email" name="email" type="email" />
        <Field defaultValue={person.phoneNumber} label="Phone number" name="phoneNumber" />
        <Field defaultValue={person.linkedinUrl} label="LinkedIn profile" name="linkedinUrl" type="url" />
        <Field defaultValue={person.twitterUrl} label="Twitter profile" name="twitterUrl" type="url" />
        <Field defaultValue={person.redditUrl} label="Reddit profile" name="redditUrl" type="url" />
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
        <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Resume</span>
        <textarea
          className="app-textarea min-h-32"
          defaultValue={person.resume ?? ""}
          name="resume"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
        <span className="text-xs text-white/50">Notes</span>
        <textarea
          className="app-textarea min-h-32"
          defaultValue={person.notes ?? ""}
          name="notes"
        />
      </label>

      <label className="flex items-center gap-3 border border-white/10 bg-[#0a0a0a] px-4 py-4 text-sm font-medium text-white/72">
        <input className="h-4 w-4 accent-white" defaultChecked={person.archived} name="archived" type="checkbox" />
        Mark this person as archived
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button className="app-button" type="submit">
          Save contact
        </button>
        <button
          className="inline-flex items-center justify-center border border-red-400/20 bg-[#140909] px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-300/40 hover:text-red-200"
          formAction={deletePersonAction}
          type="submit"
        >
          Delete person
        </button>
      </div>
    </form>
  );
}

export function PersonAssignments({ person }: { person: PersonDetail }) {
  return (
    <section className="app-panel space-y-4 p-4 md:p-5">
      <div className="space-y-1">
        <h2 className="app-section-title">Products and ICP</h2>
        <p className="app-copy">Attach as many products as you need to a person and decide whether they match the ICP for each one.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form action={assignProductTagAction} className="space-y-3 border border-white/10 bg-[#0a0a0a] p-4">
          <input name="personId" type="hidden" value={person.id} />
          <p className="text-xs text-white/48">Assign existing tag</p>
          <select
            className="app-input"
            defaultValue=""
            name="productTagId"
            required
          >
            <option disabled value="">
              Choose a product tag
            </option>
            {person.allProductTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>

          <select
            className="app-input"
            defaultValue="true"
            name="isIcp"
          >
            <option value="true">In ICP</option>
            <option value="false">Not in ICP yet</option>
          </select>

          <button className="app-button" disabled={person.allProductTags.length === 0} type="submit">
            Save product
          </button>
        </form>

        <form action={assignProductTagAction} className="space-y-3 border border-white/10 bg-[#0a0a0a] p-4">
          <input name="personId" type="hidden" value={person.id} />
          <p className="text-xs text-white/48">Create and assign tag</p>
          <input
            className="app-input"
            name="productTagName"
            placeholder="MemKit"
            required
            type="text"
          />

          <div className="flex items-center gap-3">
            <input className="h-11 w-14 border border-white/10 bg-[#050505] p-1" defaultValue="#7dd3fc" name="productTagColor" type="color" />
            <select
              className="app-input"
              defaultValue="true"
              name="isIcp"
            >
              <option value="true">In ICP</option>
              <option value="false">Not in ICP yet</option>
            </select>
          </div>

          <button className="app-button" type="submit">
            Create product
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {person.productAssignments.length === 0 ? (
          <p className="border border-dashed border-white/10 px-4 py-5 text-sm text-white/38">No product tags assigned to this person yet.</p>
        ) : (
          person.productAssignments.map((assignment) => (
            <div className="flex flex-col gap-3 border border-white/10 bg-[#0a0a0a] p-4 md:flex-row md:items-center md:justify-between" key={assignment.id}>
              <div className="flex items-center gap-3">
                <AssignmentBadge color={assignment.productTagColor} isIcp={assignment.isIcp} name={assignment.productTagName} />
              </div>

              <div className="flex flex-wrap gap-3">
                <form action={assignProductTagAction} className="flex gap-3">
                  <input name="personId" type="hidden" value={person.id} />
                  <input name="productTagId" type="hidden" value={assignment.productTagId} />
                  <input name="isIcp" type="hidden" value={String(!assignment.isIcp)} />
                  <button className="app-button-secondary px-4 py-2" type="submit">
                    Mark as {assignment.isIcp ? "Prospect" : "ICP"}
                  </button>
                </form>

                <form action={removeProductTagAction}>
                  <input name="personId" type="hidden" value={person.id} />
                  <input name="productTagId" type="hidden" value={assignment.productTagId} />
                  <button className="inline-flex items-center justify-center border border-red-400/20 bg-[#140909] px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-300/40 hover:text-red-200" type="submit">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function MessageTurnCard({ personId, messageTurn }: { personId: number; messageTurn: MessageTurn }) {
  return (
    <article className="space-y-4 border border-white/10 bg-[#0a0a0a] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="app-section-title">Sent</p>
          <p className="text-sm text-white/76">{prettyDate(messageTurn.sentAt)}</p>
        </div>
        <span
          className={`font-mono-ui border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            messageTurn.responded ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-[#050505] text-white/42"
          }`}
        >
          {messageTurn.responded ? "Responded" : "Awaiting reply"}
        </span>
      </div>

      <div className="space-y-2">
        <p className="app-section-title">Outbound message</p>
        <p className="border border-white/10 bg-[#050505] px-4 py-3 text-sm leading-6 text-white/74">{messageTurn.outboundMessage}</p>
      </div>

      <form action={updateMessageTurnResponseAction} className="space-y-3">
        <input name="personId" type="hidden" value={personId} />
        <input name="messageTurnId" type="hidden" value={messageTurn.id} />

        <label className="flex items-center gap-3 border border-white/10 bg-[#050505] px-4 py-4 text-sm font-medium text-white/72">
          <input className="h-4 w-4 accent-white" defaultChecked={messageTurn.responded} name="responded" type="checkbox" />
          Contact has responded
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
          <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Response received at</span>
          <input
            className="app-input"
            defaultValue={localDateTimeInputValue(messageTurn.respondedAt)}
            name="respondedAt"
            type="datetime-local"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
          <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Response message</span>
          <textarea
            className="app-textarea"
            defaultValue={messageTurn.responseMessage ?? ""}
            name="responseMessage"
          />
        </label>

        <button className="app-button-secondary" type="submit">
          Update response
        </button>
      </form>
    </article>
  );
}

export function MessageTimeline({ person }: { person: PersonDetail }) {
  return (
    <section className="app-panel space-y-4 p-4 md:p-5">
      <div className="space-y-1">
        <h2 className="app-section-title">Message history</h2>
        <p className="app-copy">Log each outreach turn, whether they replied, and when the response came back.</p>
      </div>

      <form action={createMessageTurnAction} className="space-y-4 border border-white/10 bg-[#0a0a0a] p-4">
        <input name="personId" type="hidden" value={person.id} />

        <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
          <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Outbound message</span>
          <textarea
            className="app-textarea min-h-32"
            name="outboundMessage"
            placeholder="Sent a short intro about the product and asked whether they handle this workflow."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
            <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Sent at</span>
            <input
              className="app-input"
              defaultValue={currentCentralDateTimeInputValue()}
              name="sentAt"
              type="datetime-local"
            />
          </label>

          <label className="flex items-center gap-3 border border-white/10 bg-[#050505] px-4 py-4 text-sm font-medium text-white/72">
            <input className="h-4 w-4 accent-white" name="responded" type="checkbox" />
            They already responded to this turn
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
            <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Response received at</span>
            <input
              className="app-input"
              name="respondedAt"
              type="datetime-local"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
            <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Response message</span>
            <textarea
              className="app-textarea min-h-24"
              name="responseMessage"
            />
          </label>
        </div>

        <button className="app-button" type="submit">
          Save message turn
        </button>
      </form>

      <div className="space-y-4">
        {person.messageTurns.length === 0 ? (
          <p className="border border-dashed border-white/10 px-4 py-5 text-sm text-white/38">No outreach turns logged yet.</p>
        ) : (
          person.messageTurns.map((messageTurn) => (
            <MessageTurnCard key={messageTurn.id} messageTurn={messageTurn} personId={person.id} />
          ))
        )}
      </div>
    </section>
  );
}
