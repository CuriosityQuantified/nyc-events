"use client";

import { useState } from "react";
import { filterLabel, type FilterState } from "@/app/data/filters";
import { followInterest, type FacetType } from "@/app/data/preferences";
import styles from "./FollowFacets.module.css";

type Followable = { facetType: FacetType; value: string; label: string };

function followableFacets(filters: FilterState): Followable[] {
  const facets: Followable[] = [];
  if (filters.borough) {
    facets.push({
      facetType: "borough",
      value: filters.borough,
      label: filterLabel("borough", filters.borough),
    });
  }
  if (filters.category) {
    facets.push({
      facetType: "category",
      value: filters.category,
      label: filterLabel("category", filters.category),
    });
  }
  if (filters.registration) {
    facets.push({
      facetType: "registration",
      value: filters.registration,
      label: `${filterLabel("registration", filters.registration)} registration`,
    });
  }
  return facets;
}

/**
 * Follow-a-Facet from Explore (#22): where someone already filtered by a
 * borough, category, or registration status, one tap turns that Facet into
 * an Interest so future matching Events find them. Managed from Profile.
 */
export default function FollowFacets({ filters }: { filters: FilterState }) {
  const [followed, setFollowed] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState<string | null>(null);
  const facets = followableFacets(filters);
  if (facets.length === 0) return null;

  const onFollow = async (facet: Followable) => {
    const key = `${facet.facetType}:${facet.value}`;
    setFailed(null);
    try {
      await followInterest(facet.facetType, facet.value);
      setFollowed((prev) => new Set(prev).add(key));
    } catch {
      setFailed(`Could not follow ${facet.label}. Try again.`);
    }
  };

  return (
    <div
      className={styles.wrapper}
      role="group"
      aria-label="Follow these filters"
      data-testid="follow-facets"
    >
      {facets.map((facet) => {
        const key = `${facet.facetType}:${facet.value}`;
        const isFollowed = followed.has(key);
        return (
          <button
            key={key}
            type="button"
            className={`${styles.follow} ${isFollowed ? styles.following : ""}`}
            aria-pressed={isFollowed}
            disabled={isFollowed}
            onClick={() => void onFollow(facet)}
          >
            {isFollowed
              ? `Following ${facet.label} ✓`
              : `Follow ${facet.label}`}
          </button>
        );
      })}
      <span className={styles.hint}>
        Followed filters become Interests — manage them in Profile.
      </span>
      {failed ? (
        <span role="alert" className={styles.error}>
          {failed}
        </span>
      ) : null}
    </div>
  );
}
