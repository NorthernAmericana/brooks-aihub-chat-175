import { useEffect, useState } from "react";
import type { CustomAto } from "@/lib/db/schema";

export function useCustomAtos() {
  const [customAtos, setCustomAtos] = useState<CustomAto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCustomAtos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/custom-atos");
        if (!response.ok) {
          throw new Error("Failed to fetch custom ATOs");
        }
        const data = await response.json();
        setCustomAtos(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setCustomAtos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomAtos();
  }, []);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/custom-atos");
      if (!response.ok) {
        throw new Error("Failed to fetch custom ATOs");
      }
      const data = await response.json();
      setCustomAtos(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return { customAtos, isLoading, error, refetch };
}
