import { useEffect, useMemo, useState } from "react";
import notesAPI from "../../../api/notes.api";
import Toast from "../../../utils/toast";
import { card, fmtDate, getApiErrorMessage, input } from "../shared";

const softOuterCardStyle = {
  ...card,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
};

export default function NotesSection({ lead, onSaved }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const normalizedNotes = useMemo(() => [...notes].sort((left, right) => {
    const leftTime = new Date(left.date || left.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right.date || right.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  }), [notes]);

  const loadNotes = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const data = await notesAPI.getAll();
      const allNotes = Array.isArray(data) ? data : [];
      const nextNotes = allNotes
        .filter((item) => Number(item?.leadId || item?.leadID || item?.lead?.id || 0) === Number(lead.id))
        .map((item) => ({
          id: item?.id,
          title: item?.title || "Note",
          content: item?.description || item?.message || item?.content || item?.noteText || item?.text || "",
          date: item?.createdAt || item?.updatedAt || item?.date,
          author: item?.createdByName || item?.author || item?.createdBy || "",
        }));
      setNotes(nextNotes);
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to load notes"));
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [lead?.id]);

  const resetEditor = () => {
    setDraft("");
    setEditingId(null);
  };

  const handleSave = async () => {
    const content = draft.trim();
    if (!content || !lead?.id) {
      Toast.error("Please add note content.");
      return;
    }

    const payload = {
      leadId: Number(lead.id),
      title: "Note",
      description: content,
      message: content,
      content,
      noteText: content,
      ...(lead.assignedToUserId ? { createdBy: Number(lead.assignedToUserId), assignedToUserId: Number(lead.assignedToUserId) } : {}),
    };

    setSaving(true);
    try {
      if (editingId) {
        await notesAPI.update(editingId, { id: editingId, ...payload });
        Toast.success("Note updated");
      } else {
        await notesAPI.create(payload);
        Toast.success("Note added");
      }
      resetEditor();
      await loadNotes();
      await onSaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, editingId ? "Unable to update note" : "Unable to add note"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setDraft(note.content || "");
  };

  const handleDelete = async (noteId) => {
    setDeletingId(noteId);
    try {
      await notesAPI.delete(noteId);
      Toast.success("Note deleted");
      if (editingId === noteId) resetEditor();
      await loadNotes();
      await onSaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to delete note"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...softOuterCardStyle, padding: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <textarea style={{ ...input, minHeight: 120, resize: "vertical" }} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a note for the sales team" />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {editingId ? <button type="button" className="btn-ghost" onClick={resetEditor} disabled={saving}>Cancel</button> : null}
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving} style={{ border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>
              {saving ? "Saving..." : editingId ? "Update Note" : "Save Note"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...softOuterCardStyle, padding: 16, display: "grid", gap: 12 }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading notes...</div> : null}
        {!loading && !normalizedNotes.length ? <div style={{ border: "1px dashed #dbe4f0", borderRadius: 16, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "28px 18px" }}>No notes saved yet.</div> : null}
        {!loading && normalizedNotes.map((note) => (
          <div key={note.id} style={{ border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, background: "#ffffff", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{note.title || "Note"}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                  {fmtDate(note.date)}
                  {note.author ? ` • ${note.author}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button type="button" className="btn-ghost" onClick={() => handleEdit(note)} disabled={saving || deletingId === note.id}>Edit</button>
                <button type="button" className="btn-ghost" onClick={() => handleDelete(note.id)} disabled={deletingId === note.id || saving} style={{ color: "#b91c1c", borderColor: "#fecaca" }}>
                  {deletingId === note.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: "#334155", whiteSpace: "pre-wrap" }}>
              {note.content || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
