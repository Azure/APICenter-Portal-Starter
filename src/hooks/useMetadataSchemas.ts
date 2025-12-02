import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { MetadataSchemaWithTitle, ParsedMetadataSchema } from '@/types/metadataSchema';

/**
 * Hook to fetch metadata schemas from API Center and parse their titles.
 * Returns a map of property name to display title.
 */
export function useMetadataSchemas() {
  const ApiService = useApiService();
  const isAuthenticated = useRecoilValue(isAuthenticatedAtom);

  return useQuery<Map<string, MetadataSchemaWithTitle>>({
    queryKey: [QueryKeys.MetadataSchemas],
    queryFn: async () => {
      const schemas = await ApiService.getMetadataSchemas();
      const schemaMap = new Map<string, MetadataSchemaWithTitle>();

      for (const schema of schemas) {
        try {
          const parsed: ParsedMetadataSchema = JSON.parse(schema.schema);
          schemaMap.set(schema.name, {
            name: schema.name,
            title: parsed.title || schema.name,
            type: parsed.type,
          });
        } catch {
          // If parsing fails, use the name as the title
          schemaMap.set(schema.name, {
            name: schema.name,
            title: schema.name,
          });
        }
      }

      return schemaMap;
    },
    staleTime: Infinity, // Metadata schemas rarely change
    enabled: Boolean(isAuthenticated),
  });
}
