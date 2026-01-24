"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserEntitlements {
  foundersAccess: boolean;
  products: string[];
}

/**
 * Hook to fetch and manage user entitlements on the client side
 */
export function useEntitlements(userId?: string) {
  const [entitlements, setEntitlements] = useState<UserEntitlements>({
    foundersAccess: false,
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/entitlements?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch entitlements");
      }
      const data = await response.json();
      setEntitlements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  return {
    entitlements,
    loading,
    error,
    refetch: fetchEntitlements,
  };
}

/**
 * Check if user has a specific entitlement
 */
export function hasEntitlement(
  entitlements: UserEntitlements,
  productId: string
): boolean {
  return entitlements.products.includes(productId);
}
