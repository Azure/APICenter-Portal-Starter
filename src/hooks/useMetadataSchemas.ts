import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { MetadataSchemaWithTitle, ParsedMetadataSchema } from '@/types/metadataSchema';

function extractOptions(parsed: ParsedMetadataSchema): Array<{ value: string; label: string }> | undefined {
  if (parsed.enum?.length) {
    return parsed.enum.map((val) => ({ value: val, label: val }));
  }

  if (parsed.oneOf?.length) {
    const options = parsed.oneOf
      .filter((entry) => entry.const != null)
      .map((entry) => ({ value: entry.const!, label: entry.description || entry.const! }));
    if (options.length) return options;
  }

  if (parsed.type === 'boolean') {
    return [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ];
  }

  return undefined;
}

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
          const options = extractOptions(parsed);
          schemaMap.set(schema.name, {
            name: schema.name,
            title: parsed.title || schema.name,
            type: parsed.type,
            options,
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
