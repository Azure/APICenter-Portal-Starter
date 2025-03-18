import { Link } from '@fluentui/react-components';
import React from 'react';
import { SchemaMetadata } from '@/types/apiSpec';

const definitions: Record<string, SchemaMetadata> = {
  TextContent: {
    refLabel: 'TextContent',
    typeLabel: 'object',
    properties: [
      {
        name: 'type',
        type: '"text"',
        required: true,
      },
      {
        name: 'text',
        type: 'string',
        description: 'The text content of the message.',
        required: true,
      },
    ],
  },
  ImageContent: {
    refLabel: 'ImageContent',
    typeLabel: 'object',
    properties: [
      {
        name: 'type',
        type: '"image"',
        required: true,
      },
      {
        name: 'data',
        type: 'string(byte)',
        description: 'The base64-encoded image data.',
        required: true,
      },
      {
        name: 'mimeType',
        type: 'string',
        description: 'The MIME type of the image. Different providers may support different image types.',
        required: true,
      },
    ],
  },
  EmbeddedResource: {
    refLabel: 'EmbeddedResource',
    typeLabel: 'object',
    properties: [
      {
        name: 'type',
        type: '"resource"',
        required: true,
      },
      {
        name: 'resource',
        type: (
          <>
            <Link href="#TextResourceContents">TextResourceContents</Link> |{' '}
            <Link href="#BlobResourceContents">BlobResourceContents</Link>
          </>
        ),
        required: true,
      },
    ],
  },
  TextResourceContents: {
    refLabel: 'TextResourceContents',
    typeLabel: 'object',
    properties: [
      {
        name: 'uri',
        type: 'string',
        description: 'The URI of this resource.',
        required: true,
      },
      {
        name: 'mimeType',
        type: 'string',
        description: 'The MIME type of this resource, if known.',
        required: false,
      },
      {
        name: 'text',
        type: 'string',
        description:
          'The text of the item. This must only be set if the item can actually be represented as text (not binary data).',
        required: true,
      },
    ],
  },
  BlobResourceContents: {
    refLabel: 'BlobResourceContents',
    typeLabel: 'object',
    properties: [
      {
        name: 'uri',
        type: 'string',
        description: 'The URI of this resource.',
        required: true,
      },
      {
        name: 'mimeType',
        type: 'string',
        description: 'The MIME type of this resource, if known.',
        required: false,
      },
      {
        name: 'blob',
        type: 'string(byte)',
        description: 'A base64-encoded string representing the binary data of the item.',
        required: true,
      },
    ],
  },
  Annotation: {
    refLabel: 'Annotation',
    typeLabel: 'object',
    properties: [
      {
        name: 'audience',
        type: (
          <>
            <Link href="#Role">Role</Link>[]
          </>
        ),
        description:
          'Describes who the intended customer of this object or data is. It can include multiple entries to indicate content useful for multiple audiences (e.g., `["user", "assistant"]`).',
        required: false,
      },
      {
        name: 'priority',
        type: 'number',
        description:
          'Describes how important this data is for operating the server. A value of 1 means "most important," and indicates that the data is effectively required, while 0 means "least important," and indicates that the data is entirely optional.',
        required: false,
      },
    ],
  },
  Role: {
    refLabel: 'Role',
    typeLabel: 'string',
    properties: [
      {
        name: 'user',
        type: 'string',
      },
      {
        name: 'assistant',
        type: 'string',
      },
    ],
    isEnum: true,
  },
};

export const toolDefinitions = [
  definitions.TextContent,
  definitions.ImageContent,
  definitions.EmbeddedResource,
  definitions.TextResourceContents,
  definitions.BlobResourceContents,
  definitions.Annotation,
  definitions.Role,
];

// TODO: probably need to rethink this entire file
export const toolResponseSchema: SchemaMetadata = {
  typeLabel: 'object',
  properties: [
    {
      name: 'content',
      in: 'body',
      type: (
        <>
          (<Link href="#TextContent">TextContent</Link> | <Link href="#ImageContent">ImageContent</Link> |{' '}
          <Link href="#EmbeddedResource">EmbeddedResource</Link>)[]
        </>
      ),
      required: true,
    },
    {
      name: 'isError',
      in: 'body',
      type: 'boolean',
      description:
        'Whether the tool call ended in an error. If not set, this is assumed to be false (the call was successful).',
      required: false,
    },
  ],
};
