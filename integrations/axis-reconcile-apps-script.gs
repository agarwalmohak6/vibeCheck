// Optional free scheduler. This script has no Gmail scope and no power to approve a reference itself.
// In Script Properties, set APP_BASE_URL and PAYMENT_RECONCILE_SECRET (same secret as Render).
function reconcileAxisPayments() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const properties = PropertiesService.getScriptProperties();
    const base = properties.getProperty('APP_BASE_URL') || '';
    const secret = properties.getProperty('PAYMENT_RECONCILE_SECRET') || '';
    if (!/^https:\/\/[^/]+\/?$/.test(base) || secret.length < 32) throw new Error('Configure the app URL and reconciliation secret.');
    const cursor = properties.getProperty('RECONCILE_CURSOR') || '';
    const response = UrlFetchApp.fetch(base.replace(/\/$/, '') + '/api/payment/reconcile' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''), {
      method: 'post', headers: { Authorization: 'Bearer ' + secret }, muteHttpExceptions: true, followRedirects: false,
    });
    if (response.getResponseCode() !== 200) throw new Error('Reconciliation unavailable; pending payments were kept for review.');
    const result = JSON.parse(response.getContentText());
    if (result.next_cursor) properties.setProperty('RECONCILE_CURSOR', result.next_cursor);
    else properties.deleteProperty('RECONCILE_CURSOR');
  } finally { lock.releaseLock(); }
}

// Run once, after configuring the backend mailbox and testing a real payment.
function installAxisReconciliationTrigger() {
  if (!ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'reconcileAxisPayments')) {
    ScriptApp.newTrigger('reconcileAxisPayments').timeBased().everyMinutes(1).create();
  }
}
