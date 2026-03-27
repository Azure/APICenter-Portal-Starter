import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@fluentui/react-components';
import styles from './ErrorBoundary.module.scss';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  componentDidMount(): void {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount(): void {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    console.error('Unhandled error:', event.error);
    this.setState({ hasError: true });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    console.error('Unhandled promise rejection:', event.reason);
    this.setState({ hasError: true });
  };

  private handleReload = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.errorPage}>
          <h1 className={styles.heading}>Oops, something went wrong</h1>
          <p className={styles.message}>Our engineers have already been notified.</p>
          <Button appearance="primary" onClick={this.handleReload}>Go to home page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
