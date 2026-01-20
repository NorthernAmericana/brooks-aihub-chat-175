export type VectorStoreSearchResult = {
  file_id: string;
  filename: string;
  score?: number;
};

type VectorStoreSearchParams = {
  query: string;
  max_num_results?: number;
};

export class OpenAI {
  apiKey?: string;
  vectorStores: {
    search: (
      _vectorStoreId: string,
      _params: VectorStoreSearchParams
    ) => Promise<{ data: VectorStoreSearchResult[] }>;
  };

  constructor({ apiKey }: { apiKey?: string }) {
    this.apiKey = apiKey;
    this.vectorStores = {
      search: async () => ({ data: [] }),
    };
  }
}
