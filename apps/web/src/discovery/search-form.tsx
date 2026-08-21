'use client';

import {
  autocompleteResponseSchema,
  type AutocompleteResponse,
} from '@career-os/contracts';
import { useEffect, useState } from 'react';

interface SearchFormProps {
  apiBaseUrl: string;
  initialQuery: string;
  initialRemote: boolean;
}

export function SearchForm({
  apiBaseUrl,
  initialQuery,
  initialRemote,
}: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<
    AutocompleteResponse['suggestions']
  >([]);

  useEffect(() => {
    if (query.trim().length < 2 || query === initialQuery) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const url = new URL('/v1/jobs/autocomplete', apiBaseUrl);
      url.searchParams.set('q', query.trim());
      void fetch(url, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return { suggestions: [] };
          return autocompleteResponseSchema.parse(await response.json());
        })
        .then((result) => setSuggestions(result.suggestions.slice(0, 6)))
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiBaseUrl, initialQuery, query]);

  return (
    <form
      className="search-panel"
      action="/discover"
      method="get"
      role="search"
    >
      <div>
        <label className="sr-only" htmlFor="job-query">
          Search current jobs
        </label>
        <input
          autoComplete="off"
          id="job-query"
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Role, skill or employer"
          type="search"
          value={query}
        />
        {suggestions.length > 0 ? (
          <ul className="suggestions" aria-label="Search suggestions">
            {suggestions.map((suggestion) => (
              <li key={`${suggestion.type}:${suggestion.value}`}>
                <button
                  onClick={() => {
                    setQuery(suggestion.value);
                    setSuggestions([]);
                  }}
                  type="button"
                >
                  <span>{suggestion.value}</span>
                  <small>
                    {suggestion.occurrences.toLocaleString('sv-SE')} ads
                  </small>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <label className="remote-filter">
        <input
          defaultChecked={initialRemote}
          name="remote"
          type="checkbox"
          value="true"
        />
        Remote
      </label>
      <button type="submit">Search jobs</button>
    </form>
  );
}
