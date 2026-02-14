export type MyFlowerDaySummary = {
  date: string;
  totals: {
    count: number;
    total_g: number;
    total_mg_thc: number;
  };
  goal: {
    target_g: number;
    target_mg_thc: number | null;
    updated_at: string;
  } | null;
  strains_used: Array<{
    strain_slug: string | null;
    strain_name: string | null;
    display_name: string;
    count: number;
    total_g: number;
    total_mg_thc: number;
  }>;
  logs: Array<{
    id: string;
    occurred_at: string;
    product_type: string;
    strain_slug: string | null;
    strain_name: string | null;
    amount_g: number | null;
    amount_mg_thc: number | null;
    notes: string | null;
    photo_asset_id: string | null;
    photo_url?: string | null;
    created_at: string;
    display: {
      date: string | null;
      time: string | null;
      strain_name: string;
      amount: string | null;
    };
  }>;
};
