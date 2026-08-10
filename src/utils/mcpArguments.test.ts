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
});
