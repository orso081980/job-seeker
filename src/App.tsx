import { useState, type MouseEvent } from "react";
import { useCompanies } from "./hooks/useCompanies";
import { useAuth } from "./hooks/useAuth";
import { useCompanyFilters, DEFAULT_FILTERS } from "./hooks/useCompanyFilters";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import FilterBar from "./components/filters/FilterBar";
import CompanyGrid from "./components/company/CompanyGrid";
import KanbanBoard from "./components/company/KanbanBoard";
import CompanyDrawer from "./components/company/CompanyDrawer";
import AddCompanyModal from "./components/company/AddCompanyModal";
import LoginModal from "./components/auth/LoginModal";

export default function App() {
  const { companies, loading, error, create, update, remove } = useCompanies();
  const { authed, login, logout } = useAuth();
  const { filters, setFilters, countries, industries, filtered } = useCompanyFilters(companies);

  const [view, setView] = useState<"grid" | "kanban">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading prospects…</div>;
  }
  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load: {error}. Is the API server running (pnpm run server)?
      </div>
    );
  }

  const selected = companies.find((c) => c.id === selectedId) ?? null;
  const jobCount = companies.filter((c) => c.hasJobPosting).length;

  const goHome = (e: MouseEvent) => {
    e.preventDefault();
    setFilters(DEFAULT_FILTERS);
    setView("grid");
    setSelectedId(null);
    setAddOpen(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setSelectedId(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        companyCount={companies.length}
        jobCount={jobCount}
        authed={authed}
        onGoHome={goHome}
        onLogout={logout}
        onLoginClick={() => setLoginOpen(true)}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        countries={countries}
        industries={industries}
        view={view}
        onViewChange={setView}
        onAdd={() => (authed ? setAddOpen(true) : setLoginOpen(true))}
        resultCount={filtered.length}
      />

      <main className="flex-1">
        {view === "grid" ? (
          <CompanyGrid companies={filtered} onOpen={setSelectedId} />
        ) : (
          <KanbanBoard
            companies={filtered}
            onOpen={setSelectedId}
            onStatusChange={(id, status) => update(id, { status })}
          />
        )}
      </main>

      <Footer />

      {selected && (
        <CompanyDrawer
          company={selected}
          authed={authed}
          onClose={() => setSelectedId(null)}
          onUpdate={update}
          onDelete={handleDelete}
        />
      )}

      {addOpen && <AddCompanyModal onClose={() => setAddOpen(false)} onCreate={create} />}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          login={login}
          onLoggedIn={() => {
            setLoginOpen(false);
          }}
        />
      )}
    </div>
  );
}
