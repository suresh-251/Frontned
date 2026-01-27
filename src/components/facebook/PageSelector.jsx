import useActiveFacebookPage from "../../hooks/useActiveFacebookPage";

export default function PageSelector({
  showLabel = true,
  onChange
}) {
  const {
    pages,
    activePage,
    loading,
    error,
    setActivePage
  } = useActiveFacebookPage();

  if (loading) return <p>Loading pages...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!pages.length) return <p>No Facebook pages found</p>;

  const handleChange = async (e) => {
    const pageId = e.target.value;
    if (!pageId) return;

    await setActivePage(pageId);

    // Optional callback (used by pages)
    if (onChange) {
      const page = pages.find(p => p.pageId === pageId);
      onChange(page);
    }
  };

  return (
    <div className="page-selector">
      {showLabel && (
        <>
          <label><strong>Active Facebook Page</strong></label>
          <br />
        </>
      )}

      <select
        value={activePage?.pageId || ""}
        onChange={handleChange}
        style={{ minWidth: 240 }}
      >
        <option value="">Select Page</option>

        {pages.map(p => (
          <option key={p.pageId} value={p.pageId}>
            {p.name} {p.isActive ? "✓" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
