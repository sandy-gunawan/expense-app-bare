function loadFixtureSummary(rows, callback) {
  queueMicrotask(() => callback(rows.map(({ month, total }) => ({ month, total }))));
}

export function csvExport(rows, callback) {
  loadFixtureSummary(rows, (summary) => {
    const body = summary.map(({ month, total }) => {
      if (!/^\d{4}-\d{2}$/.test(month) || !Number.isSafeInteger(total)) {
        return null;
      }
      return `${month},${total}`;
    });
    if (body.includes(null)) return callback(new Error('Data rekap tidak valid.'));
    callback(null, ['month,total', ...body].join('\n'));
  });
}
