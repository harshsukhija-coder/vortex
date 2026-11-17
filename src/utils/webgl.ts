let cachedSupport: boolean | null = null;

/** Returns false when the browser cannot create a WebGL context. */
export const isWebGLAvailable = (): boolean => {
  if (cachedSupport !== null) return cachedSupport;
  if (typeof document === 'undefined') {
    cachedSupport = false;
    return cachedSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false });
    cachedSupport = !!gl;
    // Drop the context so we don't hold a GPU resource.
    if (gl && 'getExtension' in gl) {
      const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
      lose?.loseContext();
    }
  } catch {
    cachedSupport = false;
  }

  return cachedSupport;
};
