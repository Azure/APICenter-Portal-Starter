import { describe, expect, it } from 'vitest';
import { HttpReqParam } from 'api-docs-ui';
import { McpTool, McpToolInputProperty } from '@/types/mcp';
import { convertMcpToolArguments } from './mcpArguments';

function convert(
  properties: Record<string, McpToolInputProperty>,
  args: HttpReqParam[],
  required: string[] = []
): ReturnType<typeof convertMcpToolArguments> {
  const inputSchema: McpTool['inputSchema'] = {
    type: 'object',
    properties,
    required,
  };

  return convertMcpToolArguments(inputSchema, args);
}

describe('convertMcpToolArguments', () => {
  it('converts every supported JSON type', () => {
    const result = convert(
      {
        text: { type: 'string' },
        count: { type: 'integer' },
        ratio: { type: 'number' },
        enabled: { type: 'boolean' },
        settings: { type: 'object' },
        ids: { type: 'array' },
        empty: { type: 'null' },
      },
      [
        { name: 'text', value: 'pet' },
        { name: 'count', value: '2' },
        { name: 'ratio', value: '2.5' },
        { name: 'enabled', value: 'TRUE' },
        { name: 'settings', value: '{"limit":2}' },
        { name: 'ids', value: '[1,2]' },
        { name: 'empty', value: 'null' },
      ]
    );

    expect(result).toEqual({
      success: true,
      arguments: {
        text: 'pet',
        count: 2,
        ratio: 2.5,
        enabled: true,
        settings: { limit: 2 },
        ids: [1, 2],
        empty: null,
      },
    });
  });

  it.each([
    ['string', 'shadow', 'shadow'],
    ['object', '{"enabled":true}', { enabled: true }],
  ] as const)('preserves "__proto__" for %s schemas', (type, inputValue, expectedValue) => {
    const globalPrototype = Object.getPrototypeOf({});
    const expectedArguments = Object.fromEntries([['__proto__', expectedValue]]);
    const properties = Object.fromEntries([['__proto__', { type }]]) as Record<string, McpToolInputProperty>;
    const conversion = convert(properties, [{ name: '__proto__', value: inputValue }]);

    expect(conversion.success).toBe(true);
    const result = conversion as Extract<typeof conversion, { success: true }>;

    expect(result).toEqual({
      success: true,
      arguments: expectedArguments,
    });
    expect(Object.hasOwn(result.arguments, '__proto__')).toBe(true);
    expect(Object.prototype.propertyIsEnumerable.call(result.arguments, '__proto__')).toBe(true);
    expect(result.arguments.__proto__).toEqual(expectedValue);
    expect(Object.getPrototypeOf(result.arguments)).toBe(Object.prototype);
    expect(Object.getPrototypeOf({})).toBe(globalPrototype);
  });

  it('omits optional empty arguments', () => {
    expect(
      convert(
        {
          text: { type: 'string' },
          count: { type: 'integer' },
        },
        [
          { name: 'text', value: '' },
          { name: 'count', value: undefined },
        ]
      )
    ).toEqual({ success: true, arguments: {} });
  });

  it('preserves required empty strings and converts required empty null values', () => {
    expect(
      convert(
        {
          text: { type: 'string' },
          empty: { type: 'null' },
        },
        [
          { name: 'text', value: '' },
          { name: 'empty', value: '' },
        ],
        ['text', 'empty']
      )
    ).toEqual({
      success: true,
      arguments: {
        text: '',
        empty: null,
      },
    });
  });

  it('rejects missing required arguments', () => {
    expect(convert({ petId: { type: 'integer' } }, [], ['petId'])).toEqual({
      success: false,
      error: 'Argument "petId" is required.',
    });
  });

  it.each([
    [{ type: 'integer' }, '2.5', 'an integer'],
    [{ type: 'number' }, '1e400', 'a number'],
    [{ type: 'boolean' }, 'yes', 'a boolean'],
    [{ type: 'object' }, '{bad json}', 'an object'],
    [{ type: 'object' }, '[1,2]', 'an object'],
    [{ type: 'array' }, '{"id":1}', 'an array'],
    [{ type: 'null' }, 'NULL', 'null'],
  ] satisfies Array<[McpToolInputProperty, string, string]>)(
    'rejects invalid %# values',
    (property, value, expectedType) => {
      expect(convert({ value: property }, [{ name: 'value', value }])).toEqual({
        success: false,
        error: `Argument "value" must be ${expectedType}.`,
      });
    }
  );

  it('preserves values for unsupported and missing schemas', () => {
    expect(
      convert(
        {
          custom: { type: 'date' },
        },
        [
          { name: 'custom', value: '2026-08-10' },
          { name: 'additional', value: 'unchanged' },
        ]
      )
    ).toEqual({
      success: true,
      arguments: {
        custom: '2026-08-10',
        additional: 'unchanged',
      },
    });
  });

  it('preserves required empty values for unsupported schema types', () => {
    expect(
      convert(
        {
          custom: { type: 'date' },
        },
        [{ name: 'custom', value: '' }],
        ['custom']
      )
    ).toEqual({
      success: true,
      arguments: {
        custom: '',
      },
    });
  });

  it('preserves required empty values when no schema is declared', () => {
    expect(convert({}, [{ name: 'custom', value: '' }], ['custom'])).toEqual({
      success: true,
      arguments: {
        custom: '',
      },
    });
  });
});
