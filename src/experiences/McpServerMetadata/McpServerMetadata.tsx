import React from 'react';
import CustomMetadata from '@/components/CustomMetadata';
import { Server } from '@/types/server';
import styles from './McpServerMetadata.module.scss';

interface McpServerMetadataProps {
  server: Server;
}

const fieldLabels: Record<string, string> = {
  $schema: 'Schema',
  name: 'Name',
  title: 'Title',
  description: 'Description',
  version: 'Version',
  websiteUrl: 'Website URL',
  website_url: 'Website URL',
  repository: 'Repository',
  status: 'Status',
  icons: 'Icons',
  _meta: 'Extension metadata',
  registryMetadata: 'Registry metadata',
  registryType: 'Registry type',
  registry_type: 'Registry type',
  registryBaseUrl: 'Registry base URL',
  registry_base_url: 'Registry base URL',
  identifier: 'Identifier',
  fileSha256: 'SHA-256',
  file_sha256: 'SHA-256',
  runtimeHint: 'Runtime',
  runtime_hint: 'Runtime',
  runtimeArguments: 'Runtime arguments',
  runtime_arguments: 'Runtime arguments',
  packageArguments: 'Package arguments',
  package_arguments: 'Package arguments',
  environmentVariables: 'Environment variables',
  environment_variables: 'Environment variables',
  transport: 'Transport',
  transport_type: 'Transport type',
  type: 'Type',
  url: 'URL',
  headers: 'Headers',
  variables: 'Variables',
  value: 'Value',
  default: 'Default',
  choices: 'Choices',
  format: 'Format',
  isRequired: 'Required',
  is_required: 'Required',
  isRepeated: 'Repeated',
  is_repeated: 'Repeated',
  isSecret: 'Secret',
  is_secret: 'Secret',
  valueHint: 'Value hint',
  value_hint: 'Value hint',
  placeholder: 'Placeholder',
  source: 'Source',
  subfolder: 'Subfolder',
  id: 'ID',
  src: 'Source URL',
  mimeType: 'MIME type',
  sizes: 'Sizes',
  theme: 'Theme',
};

function formatMetadata(value: unknown, labelFields = true, parentSecret = false): unknown {
  if (Array.isArray(value)) return value.map((entry) => formatMetadata(entry, labelFields, parentSecret));
  if (value === null || typeof value !== 'object') return value;

  const entries = Object.entries(value);
  const fields = Object.fromEntries(entries);
  const isSecret =
    parentSecret || entries.some(([key, entry]) => (key === 'isSecret' || key === 'is_secret') && entry === true);
  return Object.fromEntries(
    entries
      .filter(([key, entry]) => {
        if (entry === undefined || entry === null) return false;
        if (Array.isArray(entry) && entry.length === 0) return false;
        const canonicalKey = key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
        return !labelFields || !fieldLabels[key] || canonicalKey === key || fields[canonicalKey] == null;
      })
      .map(([key, entry]) => {
        let formatted: unknown;
        if (isSecret && (key === 'value' || key === 'default')) {
          formatted = '[redacted]';
        } else if (key === 'variables' && entry && typeof entry === 'object' && !Array.isArray(entry)) {
          formatted = Object.fromEntries(
            Object.entries(entry).map(([name, input]) => [name, formatMetadata(input, true, isSecret)])
          );
        } else {
          formatted = formatMetadata(entry, labelFields && key !== '_meta' && key !== 'registryMetadata', isSecret);
        }
        return [labelFields ? (fieldLabels[key] ?? key) : key, formatted];
      })
  );
}

/**
 * Displays MCP registry details without exposing values marked as secret.
 *
 * @param props - The server returned by the MCP registry.
 */
export const McpServerMetadata: React.FC<McpServerMetadataProps> = ({ server }) => {
  const { packages, remotes, ...details } = server;

  return (
    <div className={styles.metadata}>
      <section aria-label="MCP server details">
        <h3>Server details</h3>
        <CustomMetadata value={formatMetadata(details)} isRoot={false} />
      </section>
      {!!packages?.length && (
        <section aria-label="MCP packages">
          <h3>Packages</h3>
          {packages.map((pkg, index) => (
            <section key={index} aria-label={`Package ${index + 1}`}>
              <h4>{pkg.identifier || pkg.name || `Package ${index + 1}`}</h4>
              <CustomMetadata
                value={formatMetadata(
                  pkg.identifier && pkg.identifier === pkg.name ? { ...pkg, name: undefined } : pkg
                )}
                isRoot={false}
              />
            </section>
          ))}
        </section>
      )}
      {!!remotes?.length && (
        <section aria-label="MCP remotes">
          <h3>Remote connections</h3>
          {remotes.map((remote, index) => (
            <section key={index} aria-label={`Remote connection ${index + 1}`}>
              <h4>Remote connection {index + 1}</h4>
              <CustomMetadata
                value={formatMetadata({
                  ...remote,
                  transport_type: remote.type ?? remote.transport_type,
                  type: undefined,
                })}
                isRoot={false}
              />
            </section>
          ))}
        </section>
      )}
    </div>
  );
};
