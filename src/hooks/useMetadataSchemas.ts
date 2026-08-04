import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticatedAtom } from '@/atoms/isAuthenticatedAtom';
import { useApiService } from '@/hooks/useApiService';
import { QueryKeys } from '@/constants/QueryKeys';
import { MetadataSchemaWithTitle, ParsedMetadataSchema, SchemaOneOfEntry } from '@/types/metadataSchema';

type FilterOption = { value: string; label: string };

function optionsFromEnum(values?: string[]): FilterOption[] | undefined {
  if (!values?.length) return undefined;
  return values.map((val) => ({ value: val, label: val }));
}

function optionsFromOneOf(oneOf?: SchemaOneOfEntry[]): FilterOption[] | undefined {
  if (!oneOf?.length) return undefined;
  const options = oneOf
    .filter((entry) => entry.const != null)
    .map((entry) => ({ value: entry.const!, label: entry.description || entry.const! }));
  return options.length ? options : undefined;
}

function extractOptions(parsed: ParsedMetadataSchema): FilterOption[] | undefined {
  // Multi-select: `type: 'array'` with the value set defined on `items`.
  if (parsed.type === 'array' && parsed.items) {
    return optionsFromEnum(parsed.items.enum) ?? optionsFromOneOf(parsed.items.oneOf);
  }

  const direct = optionsFromEnum(parsed.enum) ?? optionsFromOneOf(parsed.oneOf);
  if (direct) return direct;

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
            isMultiValue: parsed.type === 'array',
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
