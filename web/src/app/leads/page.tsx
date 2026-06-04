import prisma from "@/lib/prisma";
import Link from "next/link";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;

  const where: any = { AND: [] };

  if (q) {
    where.AND.push({
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (status === "hot") {
    where.AND.push({ OR: [{ replied: true }, { status: "Hot" }] });
  } else if (status === "warm") {
    where.AND.push({ opened: true });
    where.AND.push({ replied: false });
  } else if (status === "cold") {
    where.AND.push({ opened: false });
    where.AND.push({ replied: false });
  }

  const leads = await prisma.lead.findMany({
    where: where.AND.length > 0 ? where : {},
    orderBy: { updatedAt: "desc" },
  });

  const allCount = await prisma.lead.count();
  const hotCount = await prisma.lead.count({ where: { OR: [{ replied: true }, { status: "Hot" }] } });
  const warmCount = await prisma.lead.count({ where: { AND: [{ opened: true }, { replied: false }] } });
  const coldCount = await prisma.lead.count({ where: { AND: [{ opened: false }, { replied: false }] } });

  const searchStr = q ? `&q=${encodeURIComponent(q)}` : "";

  const tabs = [
    { key: null, label: "All", count: allCount, href: q ? `/leads?q=${encodeURIComponent(q)}` : "/leads" },
    { key: "hot", label: "Hot", count: hotCount, href: `/leads?status=hot${searchStr}` },
    { key: "warm", label: "Warm", count: warmCount, href: `/leads?status=warm${searchStr}` },
    { key: "cold", label: "Cold", count: coldCount, href: `/leads?status=cold${searchStr}` },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient tracking-tight">Leads</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage and track your outreach interactions</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <form action="/leads" method="GET" className="flex-1 w-full sm:max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search by name, company..."
            className="input-dark w-full"
          />
        </form>

        <div className="flex items-center overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-button)', background: 'var(--bg-surface)' }}>
          {tabs.map((tab) => {
            const isActive = (tab.key === null && !status) || tab.key === status;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-[#64748B] hover:text-[#94A3B8]"
                }`}
                style={{
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {tab.label} <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>({tab.count})</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <LeadsClient leads={leads} />

      {/* Footer */}
      <div className="text-center text-xs py-4" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
        Showing {leads.length} of {allCount} leads
      </div>
    </div>
  );
}
