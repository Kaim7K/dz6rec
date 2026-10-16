import React from 'react';
import PageError from './PageError';

/** @extends {React.Component<{children: React.ReactNode, resetKey?: string}, {failed: boolean}>} */
export default class InterfaceBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    if (this.state.failed) return <div className="mx-auto w-full max-w-3xl p-4 sm:p-6"><PageError message="Ocorreu um erro ao abrir esta tela. Recarregue a página para tentar novamente." retryLabel="Recarregar página" onRetry={() => window.location.reload()} /></div>;
    return this.props.children;
  }
}
