export default function LeadFormCard({
  form,
  onToggle,
  onSync
}) {
  return (
    <div
      style={{
        padding: 12,
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <div>
        <strong>{form.name}</strong>
        <br />
        <small>
          Created: {new Date(form.created_time).toLocaleDateString()}
        </small>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={() => onToggle(form)}
          />
          Enabled
        </label>

        <button onClick={() => onSync(form.id)}>
          Sync
        </button>
      </div>
    </div>
  );
}
