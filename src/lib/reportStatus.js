export const STATUS_ORDER = ['ordered', 'budget_allocated', 'on_process', 'finished'];

export const STATUS_LABELS = {
  ordered: 'Ordered',
  budget_allocated: 'Budget Allocated',
  on_process: 'On Process',
  finished: 'Finished',
};

// MUI color keys — suitable for both light and dark modes
export const STATUS_COLORS = {
  ordered: 'default',        // neutral grey — just submitted
  budget_allocated: 'info',  // blue — in planning
  on_process: 'warning',     // amber — actively being worked
  finished: 'success',       // green — done
};

export function getNextStatus(currentStatus) {
  const idx = STATUS_ORDER.indexOf(currentStatus);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null; // no next stage
  return STATUS_ORDER[idx + 1];
}

export function getNextStatusLabel(currentStatus) {
  const next = getNextStatus(currentStatus);
  return next ? STATUS_LABELS[next] : null;
}
