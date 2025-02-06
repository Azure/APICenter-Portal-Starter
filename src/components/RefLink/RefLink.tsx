import React from 'react';
import { Link } from '@fluentui/react-components';
import { getRefLabel } from '@/utils/openApi';

interface Props {
  $ref: string;
  className?: string;
  children?: React.ReactNode;
}

export const RefLink: React.FC<Props> = ({ $ref, className, children }) => {
  const refLabel = getRefLabel($ref);
  return (
    <Link className={className} href={`#${refLabel}`}>
      {children || refLabel}
    </Link>
  );
};

export default React.memo(RefLink);
