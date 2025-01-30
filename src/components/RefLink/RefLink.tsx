import React from 'react';
import { Link } from '@fluentui/react-components';
import { getRefLabel } from '@/utils/openApi';

interface Props {
  $ref: string;
}

export const RefLink: React.FC<Props> = ({ $ref }) => {
  const refLabel = getRefLabel($ref);
  return <Link href={`#${refLabel}`}>{refLabel}</Link>;
};

export default React.memo(RefLink);
