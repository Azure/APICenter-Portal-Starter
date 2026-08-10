import { HttpReqParam } from 'api-docs-ui';
import { McpTool, McpToolInputProperty } from '@/types/mcp';

interface McpArgumentsConversionSuccess {
  success: true;
  arguments: Record<string, unknown>;
}

interface McpArgumentsConversionFailure {
  success: false;
  error: string;
}

interface McpValueConversionSuccess {
  success: true;
  value: unknown;
}

export type McpArgumentsConversionResult = McpArgumentsConversionSuccess | McpArgumentsConversionFailure;

const EXPECTED_TYPE_LABELS: Record<string, string> = {
  integer: 'an integer',
  number: 'a number',
  boolean: 'a boolean',
  object: 'an object',
  array: 'an array',
  null: 'null',
};

const STRICT_SCHEMA_TYPES = new Set(['string', 'integer', 'number', 'boolean', 'object', 'array', 'null']);

function invalidType(name: string, type: string): McpArgumentsConversionFailure {
  return {
    success: false,
    error: `Argument "${name}" must be ${EXPECTED_TYPE_LABELS[type]}.`,
  };
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function convertValue(
  name: string,
  value: string,
  schema?: McpToolInputProperty
): McpValueConversionSuccess | McpArgumentsConversionFailure {
  switch (schema?.type) {
    case 'string':
      return { success: true, value };

    case 'integer':
    case 'number': {
      const parsed = parseJson(value);
      const isValidNumber = typeof parsed === 'number' && Number.isFinite(parsed);
      const isValidInteger = schema.type !== 'integer' || (isValidNumber && Number.isInteger(parsed));
      if (!isValidNumber || !isValidInteger) {
        return invalidType(name, schema.type);
      }
      return { success: true, value: parsed };
    }

    case 'boolean': {
      const normalized = value.trim().toLowerCase();
      if (normalized !== 'true' && normalized !== 'false') {
        return invalidType(name, schema.type);
      }
      return { success: true, value: normalized === 'true' };
    }

    case 'object': {
      const parsed = parseJson(value);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return invalidType(name, schema.type);
      }
      return { success: true, value: parsed };
    }

    case 'array': {
      const parsed = parseJson(value);
      if (!Array.isArray(parsed)) {
        return invalidType(name, schema.type);
      }
      return { success: true, value: parsed };
    }

    case 'null':
      if (value.trim() !== 'null') {
        return invalidType(name, schema.type);
      }
      return { success: true, value: null };

    default:
      return { success: true, value };
  }
}

/**
 * Converts MCP tool form values according to the tool input schema.
 *
 * @param inputSchema - The selected tool's declared input schema.
 * @param args - String values collected by the current test-console form.
 * @returns Typed arguments, or the first validation error that blocks the call.
 * @example
 * convertMcpToolArguments(inputSchema, [{ name: 'enabled', value: 'true' }]);
 */
export function convertMcpToolArguments(
  inputSchema: McpTool['inputSchema'],
  args: HttpReqParam[]
): McpArgumentsConversionResult {
  const properties = inputSchema.properties ?? {};
  const required = new Set(inputSchema.required ?? []);
  const values = new Map(args.map(({ name, value }) => [name, value]));
  const names = new Set([...values.keys(), ...required]);
  const convertedArguments: Record<string, unknown> = {};

  for (const name of names) {
    const value = values.get(name);
    const schema = properties[name];
    const isEmpty = value === undefined || value === '';

    if (isEmpty) {
      if (!required.has(name)) {
        continue;
      }

      if (!schema?.type || !STRICT_SCHEMA_TYPES.has(schema.type)) {
        convertedArguments[name] = '';
        continue;
      }

      if (schema.type === 'string') {
        convertedArguments[name] = '';
        continue;
      }

      if (schema?.type === 'null') {
        convertedArguments[name] = null;
        continue;
      }

      return {
        success: false,
        error: `Argument "${name}" is required.`,
      };
    }

    const converted = convertValue(name, value, schema);
    if (converted.success === false) {
      return converted;
    }

    convertedArguments[name] = converted.value;
  }

  return {
    success: true,
    arguments: convertedArguments,
  };
}
