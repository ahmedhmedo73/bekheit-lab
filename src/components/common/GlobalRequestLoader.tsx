import { useSyncExternalStore } from 'react';
import { requestActivity } from '../../services/requestActivity';
import './GlobalRequestLoader.css';

export function GlobalRequestLoader() {
  const pending = useSyncExternalStore(requestActivity.subscribe, requestActivity.getSnapshot, () => 0);
  if (!pending) return null;
  return <div className="global-request-loader" role="status" aria-live="polite" aria-label="Loading data">
    <div className="global-request-progress" />
    <div className="global-request-label"><span className="btn-spinner" aria-hidden="true" />Loading...</div>
  </div>;
}
