import React, { useCallback } from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Checkbox,
  Divider,
} from '@fluentui/react-components';
import { CheckboxOnChangeData } from '@fluentui/react-checkbox';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { FilterType } from '@/types/apiFilters';
import styles from './ApiFilters.module.scss';

export const ApiFilters: React.FC = () => {
  const searchFilters = useSearchFilters();

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
      const type = e.currentTarget.getAttribute('data-type') as FilterType;
      const value = e.currentTarget.value;

      if (data.checked) {
        searchFilters.add({ type, value });
      } else {
        searchFilters.remove({ type, value });
      }
    },
    [searchFilters]
  );

  return (
    <Accordion className={styles.apiFilters} defaultOpenItems={Object.keys(searchFilters.metadata)} multiple>
      {Object.entries(searchFilters.metadata).map(([type, filterMetadata], index, entries) => (
        <React.Fragment key={type}>
          <AccordionItem value={type}>
            <AccordionHeader expandIconPosition="end">
              <h3>{filterMetadata.label}</h3>
            </AccordionHeader>
            <AccordionPanel>
              {filterMetadata.options.map((option) => (
                <div key={option.value}>
                  <Checkbox
                    label={option.label}
                    data-type={type}
                    value={option.value}
                    checked={searchFilters.isActive({ type: type as FilterType, value: option.value })}
                    onChange={handleFilterChange}
                  />
                </div>
              ))}
            </AccordionPanel>
          </AccordionItem>
          {index !== entries.length - 1 && <Divider className={styles.divider} />}
        </React.Fragment>
      ))}
    </Accordion>
  );
};

export default React.memo(ApiFilters);
