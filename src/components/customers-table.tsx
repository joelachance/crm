"use client";

import Link from "next/link";
import { useState } from "react";

import type { PersonSummary } from "@/lib/types";
import { productTagColorStyles } from "@/lib/utils";

type ActiveFilter = "all" | "active" | "archived";
type IcpFilter = "all" | "yes" | "mixed" | "no";
type SocialFilter = "all" | "linkedin" | "twitter" | "reddit" | "none";
type TurnsFilter = "all" | "0" | "1plus" | "3plus";

function getIcpStatus(person: PersonSummary): "yes" | "mixed" | "no" {
  if (person.productAssignments.length === 0) {
    return "no";
  }

  const icpCount = person.productAssignments.filter((assignment) => assignment.isIcp).length;

  if (icpCount === 0) {
    return "no";
  }

  if (icpCount === person.productAssignments.length) {
    return "yes";
  }

  return "mixed";
}

function getPrimarySocialLink(person: PersonSummary) {
  if (person.linkedinUrl) {
    return { href: person.linkedinUrl, label: "LinkedIn", platform: "linkedin" as const };
  }

  if (person.twitterUrl) {
    return { href: person.twitterUrl, label: "Twitter", platform: "twitter" as const };
  }

  if (person.redditUrl) {
    return { href: person.redditUrl, label: "Reddit", platform: "reddit" as const };
  }

  return null;
}

function matchesTurnsFilter(turnCount: number, turnsFilter: TurnsFilter) {
  if (turnsFilter === "0") {
    return turnCount === 0;
  }

  if (turnsFilter === "1plus") {
    return turnCount >= 1;
  }

  if (turnsFilter === "3plus") {
    return turnCount >= 3;
  }

  return true;
}

function FilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`app-input h-10 px-3 py-2 text-xs ${props.className ?? ""}`.trim()} />;
}

function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`app-input h-10 px-3 py-2 text-xs ${props.className ?? ""}`.trim()} />;
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#090909] px-3 py-3">
      <div className="flex h-full items-center">
        <p className="text-xs text-white/48">{children}</p>
      </div>
    </div>
  );
}

function BodyCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#070707] px-3 py-3">
      <div className="flex h-full items-center">{children}</div>
    </div>
  );
}

export function CustomersTable({ people }: { people: PersonSummary[] }) {
  const [nameFilter, setNameFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [icpFilter, setIcpFilter] = useState<IcpFilter>("all");
  const [socialFilter, setSocialFilter] = useState<SocialFilter>("all");
  const [turnsFilter, setTurnsFilter] = useState<TurnsFilter>("all");
  const [tagsFilter, setTagsFilter] = useState("");

  const filteredPeople = people.filter((person) => {
    const nameMatch = person.fullName.toLowerCase().includes(nameFilter.trim().toLowerCase());
    const companyMatch = (person.companyName ?? "").toLowerCase().includes(companyFilter.trim().toLowerCase());
    const tagNames = person.productAssignments.map((assignment) => assignment.productTagName).join(" ").toLowerCase();
    const tagsMatch = tagNames.includes(tagsFilter.trim().toLowerCase());
    const icpStatus = getIcpStatus(person);
    const socialLink = getPrimarySocialLink(person);

    if (!nameMatch || !companyMatch || !tagsMatch) {
      return false;
    }

    if (activeFilter === "active" && person.archived) {
      return false;
    }

    if (activeFilter === "archived" && !person.archived) {
      return false;
    }

    if (icpFilter !== "all" && icpStatus !== icpFilter) {
      return false;
    }

    if (socialFilter === "none" && socialLink) {
      return false;
    }

    if (socialFilter !== "all" && socialFilter !== "none" && socialLink?.platform !== socialFilter) {
      return false;
    }

    if (!matchesTurnsFilter(person.messageTurns.length, turnsFilter)) {
      return false;
    }

    return true;
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <details className="app-details group">
          <summary className="app-button-secondary h-10 cursor-pointer px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/72">
            Filters
          </summary>
          <div className="mt-2 w-full min-w-[900px] border border-white/10 bg-[#070707] p-3">
            <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
              <FilterInput onChange={(event) => setNameFilter(event.target.value)} placeholder="Filter name" value={nameFilter} />
              <FilterSelect onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)} value={activeFilter}>
                <option value="all">All activity</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </FilterSelect>
              <FilterInput onChange={(event) => setCompanyFilter(event.target.value)} placeholder="Filter company" value={companyFilter} />
              <FilterSelect onChange={(event) => setIcpFilter(event.target.value as IcpFilter)} value={icpFilter}>
                <option value="all">All fit</option>
                <option value="yes">ICP</option>
                <option value="mixed">Mixed</option>
                <option value="no">Not ICP</option>
              </FilterSelect>
              <FilterSelect onChange={(event) => setSocialFilter(event.target.value as SocialFilter)} value={socialFilter}>
                <option value="all">All links</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
                <option value="reddit">Reddit</option>
                <option value="none">None</option>
              </FilterSelect>
              <FilterSelect onChange={(event) => setTurnsFilter(event.target.value as TurnsFilter)} value={turnsFilter}>
                <option value="all">All turns</option>
                <option value="0">0 turns</option>
                <option value="1plus">1+ turns</option>
                <option value="3plus">3+ turns</option>
              </FilterSelect>
              <FilterInput onChange={(event) => setTagsFilter(event.target.value)} placeholder="Filter tags" value={tagsFilter} />
            </div>
          </div>
        </details>
        <p className="text-xs text-white/34">{filteredPeople.length} shown</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[minmax(220px,1.6fr)_110px_minmax(180px,1.1fr)_110px_120px_110px_minmax(260px,1.4fr)] gap-px border-y border-white/10 bg-white/10">
            <HeaderCell>Name</HeaderCell>
            <HeaderCell>Active</HeaderCell>
            <HeaderCell>Company</HeaderCell>
            <HeaderCell>ICP</HeaderCell>
            <HeaderCell>Link</HeaderCell>
            <HeaderCell>Turns</HeaderCell>
            <HeaderCell>Product tags</HeaderCell>
          </div>

          {filteredPeople.length === 0 ? (
            <div className="px-4 py-8 text-sm text-white/38">No customers match the current filters.</div>
          ) : (
            filteredPeople.map((person) => {
              const icpStatus = getIcpStatus(person);
              const socialLink = getPrimarySocialLink(person);

              return (
                <div
                  className="grid grid-cols-[minmax(220px,1.6fr)_110px_minmax(180px,1.1fr)_110px_120px_110px_minmax(260px,1.4fr)] gap-px border-t border-white/10 bg-white/10"
                  key={person.id}
                >
                  <BodyCell>
                    <Link className="text-sm text-white underline decoration-white/10 underline-offset-4 transition hover:text-white/80" href={`/people/${person.id}`}>
                      {person.fullName}
                    </Link>
                  </BodyCell>
                  <BodyCell>
                    <span
                      className={`inline-flex border px-2 py-1 text-[11px] ${
                        person.archived ? "border-white/10 bg-[#101010] text-white/42" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {person.archived ? "No" : "Yes"}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    <p className="text-sm text-white/72">{person.companyName ?? "-"}</p>
                  </BodyCell>
                  <BodyCell>
                    <span
                      className={`inline-flex border px-2 py-1 text-[11px] ${
                        icpStatus === "yes"
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                          : icpStatus === "mixed"
                            ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                            : "border-white/10 bg-[#101010] text-white/42"
                      }`}
                    >
                      {icpStatus === "yes" ? "ICP" : icpStatus === "mixed" ? "Mixed" : "No"}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    {socialLink ? (
                      <a className="text-sm text-white/72 underline decoration-white/15 underline-offset-4 hover:text-white" href={socialLink.href} rel="noreferrer" target="_blank">
                        {socialLink.label}
                      </a>
                    ) : (
                      <span className="text-sm text-white/34">-</span>
                    )}
                  </BodyCell>
                  <BodyCell>
                    <p className="text-sm text-white/72">{person.messageTurns.length}</p>
                  </BodyCell>
                  <BodyCell>
                    {person.productAssignments.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {person.productAssignments.map((assignment) => (
                          <span className="border px-2 py-1 text-[11px]" key={assignment.id} style={productTagColorStyles(assignment.productTagColor)}>
                            {assignment.productTagName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-white/34">-</span>
                    )}
                  </BodyCell>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
