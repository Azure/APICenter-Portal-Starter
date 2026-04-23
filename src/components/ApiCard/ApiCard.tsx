import React from 'react';
import { Badge, Card, CardHeader, Text, makeStyles, tokens, shorthands } from '@fluentui/react-components';
import { formatKindDisplay } from '@/utils/formatKind';

export interface ApiCardApi {
  name: string;
  displayName: string;
  description: string;
  type?: string;
  lifecycleStage?: string;
}

interface Props {
  api: ApiCardApi;
  onClick?: (e: React.MouseEvent) => void;
  showType?: boolean;
}

const STANDALONE_KINDS = ['skill', 'a2a', 'mcp', 'plugin', 'agent', 'languagemodel'];

function getCategoryLabel(type?: string): string {
  if (type && STANDALONE_KINDS.includes(type.toLowerCase())) {
    return formatKindDisplay(type);
  }
  return 'API';
}

const useStyles = makeStyles({
  card: {
    minHeight: '200px',
    height: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    boxShadow: tokens.shadow8,
  },
  tags: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  description: {
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
});

export const ApiCard: React.FC<Props> = ({ api, showType, onClick }) => {
  const classes = useStyles();

  return (
    <Card
      className={classes.card}
      focusMode="tab-exit"
      onClick={onClick}
      aria-label={api.displayName}
    >
      {showType && (
        <div className={classes.tags}>
          <Badge appearance="filled" color="brand" shape="circular">{getCategoryLabel(api.type)}</Badge>
          {!!api.type && !STANDALONE_KINDS.includes(api.type.toLowerCase()) && (
            <Badge appearance="tint" color="brand" shape="circular">{formatKindDisplay(api.type)}</Badge>
          )}
        </div>
      )}
      <CardHeader
        header={<Text weight="semibold" size={400}>{api.displayName}</Text>}
        description={
          api.description ? (
            <Text className={classes.description} size={300}>
              {api.description}
            </Text>
          ) : undefined
        }
      />
    </Card>
  );
};

export default React.memo(ApiCard);
