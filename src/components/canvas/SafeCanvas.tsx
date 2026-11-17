import { Component, ReactNode, useEffect, useState } from 'react';
import { isWebGLAvailable } from '../../utils/webgl';

interface BoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Keep the page alive when Three.js fails to create a context.
    console.warn('[SafeCanvas] WebGL scene disabled:', error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

/**
 * Only mounts Three.js / R3F children when WebGL works.
 * Also catches runtime context errors so they never crash React.
 */
const SafeCanvas = ({ children, fallback = null }: BoundaryProps) => {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(isWebGLAvailable());
  }, []);

  if (supported === null) return <>{fallback}</>;
  if (!supported) return <>{fallback}</>;

  return <WebGLErrorBoundary fallback={fallback}>{children}</WebGLErrorBoundary>;
};

export default SafeCanvas;
