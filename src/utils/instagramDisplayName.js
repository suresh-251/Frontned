// Frontend-only fallback name formatter
export function getInstagramDisplayName(account) {
  // If backend ever sends name later, this will auto-use it
  if (account.name && account.name !== account.instagramBusinessId) {
    return account.name;
  }

  if (account.displayName && account.displayName !== account.instagramBusinessId) {
    return account.displayName;
  }

  // Fallback: user-friendly label
  const id = account.instagramBusinessId;
  return `Instagram Account (${id.slice(-6)})`;
}
