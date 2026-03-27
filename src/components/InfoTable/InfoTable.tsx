import React, { useMemo, Children, isValidElement, cloneElement } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@fluentui/react-components';
import styles from './InfoTable.module.scss';

/* ---------- Sub-components ---------- */

interface CollapsibleRowProps {
  label: string;
  children?: React.ReactNode;
  noDataMessage?: string;
  fullWidthColSpan?: number;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({
  label,
  children,
  noDataMessage = 'No items',
  fullWidthColSpan,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <>
      <TableRow className={styles.collapsibleRow} onClick={() => setIsExpanded((v) => !v)}>
        <TableCell colSpan={fullWidthColSpan}>
          <button className={styles.expandButton} type="button">
            <span className={isExpanded ? styles.chevronExpanded : styles.chevron}>&#9654;</span>
            {label}
          </button>
        </TableCell>
      </TableRow>
      {isExpanded && !Children.count(children) && (
        <TableRow>
          <TableCell colSpan={fullWidthColSpan} style={{ textAlign: 'center' }}>
            {noDataMessage}
          </TableCell>
        </TableRow>
      )}
      {isExpanded && children}
    </>
  );
};

/* ---------- Main component ---------- */

interface InfoTableProps {
  columnLabels: string[];
  children?: React.ReactNode;
  noDataMessage?: string;
}

const InfoTableComponent: React.FC<InfoTableProps> = ({
  columnLabels,
  children,
  noDataMessage = 'No items',
}) => {
  const processedChildren = useMemo(
    () =>
      Children.map(children, (child) =>
        isValidElement(child) && child.type === CollapsibleRow
          ? cloneElement(child as React.ReactElement<CollapsibleRowProps>, {
              fullWidthColSpan:
                (child.props as CollapsibleRowProps).fullWidthColSpan || columnLabels.length,
              noDataMessage:
                (child.props as CollapsibleRowProps).noDataMessage || noDataMessage,
            })
          : child,
      ),
    [children, columnLabels.length, noDataMessage],
  );

  return (
    <div className={styles.tableContainer}>
      <Table className={styles.infoTable}>
        <TableHeader>
          <TableRow>
            {columnLabels.map((label) => (
              <TableHeaderCell key={label}>
                <strong>{label}</strong>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!Children.count(processedChildren) && (
            <TableRow>
              <TableCell colSpan={columnLabels.length} style={{ textAlign: 'center' }}>
                {noDataMessage}
              </TableCell>
            </TableRow>
          )}
          {processedChildren}
        </TableBody>
      </Table>
    </div>
  );
};

/* ---------- Composite export ---------- */

type InfoTableType = React.FC<InfoTableProps> & {
  Row: typeof TableRow;
  Cell: typeof TableCell;
  CollapsibleRow: typeof CollapsibleRow;
};

export const InfoTable = React.memo(InfoTableComponent) as unknown as InfoTableType;
InfoTable.Row = TableRow;
InfoTable.Cell = TableCell;
InfoTable.CollapsibleRow = CollapsibleRow;

export default InfoTable;
