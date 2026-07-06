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
import SourcingPage from "./components/sourcing/SourcingPage";

export default function App() {
  const { companies, loading, error, create, update, remove, addLocal } = useCompanies();
  const { authed, login, logout } = useAuth();

  const newCompanies = companies.filter((c) => c.status === "new");
  const progressCompanies = companies.filter((c) => c.status !== "new");

  const home = useCompanyFilters(newCompanies);
  const progress = useCompanyFilters(progressCompanies);

  const [page, setPage] = useState<"companies" | "progress" | "sourcing">("companies");
  const [homeView, setHomeView] = useState<"grid" | "kanban">("grid");
  const [progressView, setProgressView] = useState<"grid" | "kanban">("grid");
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
    home.setFilters(DEFAULT_FILTERS);
    setHomeView("grid");
    setPage("companies");
    setSelectedId(null);
    setAddOpen(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setSelectedId(null);
  };

  const handleLogout = async () => {
    await logout();
    setPage("companies");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        companyCount={companies.length}
        jobCount={jobCount}
        authed={authed}
        page={page}
        onGoHome={goHome}
        onProgressClick={() => setPage("progress")}
        onSourcingClick={() => (authed ? setPage("sourcing") : setLoginOpen(true))}
        onLogout={handleLogout}
        onLoginClick={() => setLoginOpen(true)}
      />

      {page === "companies" && (
        <>
          <FilterBar
            filters={home.filters}
            onChange={home.setFilters}
            countries={home.countries}
            industries={home.industries}
            view={homeView}
            onViewChange={setHomeView}
            onAdd={() => (authed ? setAddOpen(true) : setLoginOpen(true))}
            resultCount={home.filtered.length}
          />

          <main className="flex-1">
            {homeView === "grid" ? (
              <CompanyGrid companies={home.filtered} onOpen={setSelectedId} />
            ) : (
              <KanbanBoard
                companies={home.filtered}
                onOpen={setSelectedId}
                onStatusChange={(id, status) => update(id, { status })}
              />
            )}
          </main>
        </>
      )}

      {page === "progress" && (
        <>
          <FilterBar
            filters={progress.filters}
            onChange={progress.setFilters}
            countries={progress.countries}
            industries={progress.industries}
            view={progressView}
            onViewChange={setProgressView}
            onAdd={() => (authed ? setAddOpen(true) : setLoginOpen(true))}
            resultCount={progress.filtered.length}
          />

          <main className="flex-1">
            {progressView === "grid" ? (
              <CompanyGrid companies={progress.filtered} onOpen={setSelectedId} />
            ) : (
              <KanbanBoard
                companies={progress.filtered}
                onOpen={setSelectedId}
                onStatusChange={(id, status) => update(id, { status })}
              />
            )}
          </main>
        </>
      )}

      {page === "sourcing" && (
        <main className="flex-1">
          <SourcingPage onPromoted={addLocal} />
        </main>
      )}

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
