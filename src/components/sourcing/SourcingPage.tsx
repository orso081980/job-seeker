import { APIProvider } from "@vis.gl/react-google-maps";
import { useSourcing } from "../../hooks/useSourcing";
import type { Company } from "../../types";
import SourceSearchForm from "./SourceSearchForm";
import SourceResultCard from "./SourceResultCard";
import ShortlistCard from "./ShortlistCard";
import Button from "../ui/Button";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export default function SourcingPage({ onPromoted }: { onPromoted: (company: Company) => void }) {
  const {
    shortlist,
    loadingShortlist,
    results,
    nextPageToken,
    skipped,
    searching,
    searchError,
    search,
    loadMore,
    addToShortlist,
    discard,
    promote,
  } = useSourcing();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-gray-900 dark:text-gray-100">
          Source companies
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Search Google Maps by category and location, open each website to decide, then shortlist the
          ones worth contacting.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        {MAPS_API_KEY ? (
          <APIProvider apiKey={MAPS_API_KEY}>
            <SourceSearchForm onSearch={search} searching={searching} results={results} />
          </APIProvider>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your .env file to enable the location map.
          </p>
        )}
        {searchError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{searchError}</p>}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Results ({results.length})
            </h2>
            {skipped > 0 && (
              <span className="text-xs text-gray-400">{skipped} without a public website skipped</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((r) => (
              <SourceResultCard key={r.placeId} result={r} onAdd={() => addToShortlist(r)} />
            ))}
          </div>
          {nextPageToken && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" onClick={loadMore} disabled={searching}>
                {searching ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 border-t border-gray-200 pt-6 dark:border-white/10">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Shortlist ({shortlist.length})
        </h2>
        {loadingShortlist ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : shortlist.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nothing shortlisted yet — add companies from the search results above.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shortlist.map((c) => (
              <ShortlistCard
                key={c.id}
                company={c}
                onDiscard={() => discard(c.id)}
                onPromote={async () => {
                  const company = await promote(c.id);
                  onPromoted(company);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
