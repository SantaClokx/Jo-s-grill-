"use client";

import { useMemo, useState } from "react";

import { MenuItemCard } from "@/components/menu-item-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { MENU_CATEGORIES, MENU_ITEMS } from "@/lib/menu";
import type { MenuCategoryId } from "@/types";

type Filter = "all" | MenuCategoryId;

const CATEGORY_IDS = new Set<string>(MENU_CATEGORIES.map((category) => category.id));

function isFilter(value: string | undefined): value is Filter {
  return value === "all" || (value !== undefined && CATEGORY_IDS.has(value));
}

export function MenuCatalogue({ initialCategory }: { initialCategory?: string }) {
  const [filter, setFilter] = useState<Filter>(
    isFilter(initialCategory) ? initialCategory : "all",
  );
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = filter === "all" || item.categoryId === filter;
      const matchesQuery =
        needle === "" ||
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [filter, query]);

  const activeCategory = MENU_CATEGORIES.find((category) => category.id === filter);

  return (
    <div>
      <div className="sticky top-[68px] z-30 -mx-[4%] mb-8 border-b border-line bg-cream/95 px-4 py-4 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border">
        <label htmlFor="menu-search" className="sr-only">
          Search the menu
        </label>
        <input
          id="menu-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a dish…"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand"
        />

        <div
          role="tablist"
          aria-label="Menu categories"
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {MENU_CATEGORIES.map((category) => (
            <FilterChip
              key={category.id}
              active={filter === category.id}
              onClick={() => setFilter(category.id)}
            >
              {category.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {activeCategory && (
        <p className="mb-6 text-sm text-muted">{activeCategory.description}</p>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No dishes match your search"
          description={`We couldn't find anything for “${query.trim()}”. Try a different dish or browse the full menu.`}
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-ink-soft"
            >
              Show all dishes
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <ButtonLink href="/cart" variant="dark" size="lg">
          Go to cart &amp; checkout
        </ButtonLink>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink hover:border-ink/30"
      }`}
    >
      {children}
    </button>
  );
}
