import React from 'react';
import { Card, Text, makeStyles, tokens, shorthands } from '@fluentui/react-components';

interface Props {
  url: string;
}

const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.81 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
  </svg>
);

const useStyles = makeStyles({
  card: {
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    cursor: 'pointer',
    boxShadow: tokens.shadow8,
  },
  icon: {
    width: '48px',
    height: '48px',
    color: tokens.colorNeutralForeground2,
  },
});

export const ContributeCard: React.FC<Props> = ({ url }) => {
  const classes = useStyles();

  return (
    <Card
      className={classes.card}
      focusMode="tab-exit"
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      aria-label="Contribute — Share plugins, skills, and agents"
    >
      <GitHubIcon className={classes.icon} />
      <Text weight="semibold" size={400}>+ Contribute</Text>
      <Text size={300} align="center">Share plugins, skills, and agents</Text>
    </Card>
  );
};

export default React.memo(ContributeCard);
