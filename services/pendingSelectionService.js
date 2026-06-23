const pendingSelections = new Map();

function savePendingSelection(chatId, data) {
  pendingSelections.set(chatId, data);
}

function getPendingSelection(chatId) {
  return pendingSelections.get(chatId);
}

function removePendingSelection(chatId) {
  pendingSelections.delete(chatId);
}

module.exports = {
  savePendingSelection,
  getPendingSelection,
  removePendingSelection,
};