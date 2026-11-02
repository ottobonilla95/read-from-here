const MENU = 'read-selected-text';
const prepareStorage = () => Promise.all([
  chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }),
  chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
]);
prepareStorage().catch(() => {});
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({ id: MENU, title: 'Read selected text', contexts: ['selection'] }));
});
async function attach(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}
chrome.action.onClicked.addListener(tab => {
  // Open immediately: sidePanel.open must retain the toolbar click's user gesture.
  chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  attach(tab.id).catch(() => {});
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU || !tab?.id) return;
  chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  const pending = { text: info.selectionText, title: tab.title, url: tab.url, tabId: tab.id, nonce: crypto.randomUUID() };
  chrome.storage.session.set({ pendingSelection: pending }).catch(() => {});
});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.target !== 'background' || sender.id !== chrome.runtime.id) return;
  if (message.action === 'attach') {
    attach(message.tabId).then(() => respond({ ok: true })).catch(() => respond({ ok: false, error: 'Open a normal web page and click the extension icon there first. Browser settings, store pages, and built-in PDF viewers cannot be read.' }));
    return true;
  }
});
// Native speech must stop when its controlling panel closes.
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'reader-panel') port.onDisconnect.addListener(() => chrome.tts.stop());
});
