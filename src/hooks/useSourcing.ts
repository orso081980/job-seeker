import { useEffect, useState } from "react";
import type { Company, SourceResult, SourceSearchParams, SourcedCompany } from "../types";
import { api } from "../api/client";

export function useSourcing() {
  const [shortlist, setShortlist] = useState<SourcedCompany[]>([]);
  const [loadingShortlist, setLoadingShortlist] = useState(true);

  const [results, setResults] = useState<SourceResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [lastParams, setLastParams] = useState<SourceSearchParams | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    api
      .sourcingList()
      .then(setShortlist)
      .finally(() => setLoadingShortlist(false));
  }, []);

  const search = async (params: SourceSearchParams) => {
    setSearching(true);
    setSearchError(null);
    try {
      const res = await api.sourcingSearch(params);
      setResults(res.results);
      setNextPageToken(res.nextPageToken);
      setSkipped(res.skipped);
      setLastParams(params);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const loadMore = async () => {
    if (!lastParams || !nextPageToken) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await api.sourcingSearch({ ...lastParams, pageToken: nextPageToken });
      setResults((rs) => [...rs, ...res.results]);
      setNextPageToken(res.nextPageToken);
      setSkipped((s) => s + res.skipped);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const addToShortlist = async (result: SourceResult) => {
    const created = await api.sourcingAdd(result);
    setShortlist((s) => (s.some((c) => c.id === created.id) ? s : [...s, created]));
    setResults((rs) =>
      rs.map((r) => (r.placeId === result.placeId ? { ...r, alreadySourced: true } : r))
    );
  };

  const discard = async (id: string) => {
    await api.sourcingRemove(id);
    setShortlist((s) => s.filter((c) => c.id !== id));
  };

  const promote = async (id: string): Promise<Company> => {
    const company = await api.sourcingPromote(id);
    setShortlist((s) => s.filter((c) => c.id !== id));
    return company;
  };

  return {
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
  };
}
