import { forwardRef } from "react";
import { offset } from "@floating-ui/react";
import DatePicker from "react-datepicker";
import {
  datePickerInputBase,
  floatingErrorText,
  floatingInput,
  floatingLabel,
  floatingWrap,
  hasValue,
} from "./shared";

export function InfoRow({ icon: Icon, label, value }) {
  if (!hasValue(value)) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "start", padding: "10px 0", borderBottom: "1px solid #edf2f7" }}>
      <div style={{ width: 24, height: 24, borderRadius: 9, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><Icon size={13} /></div>
      <div><div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div><div style={{ marginTop: 4, fontSize: 12, color: "#1e293b", wordBreak: "break-word" }}>{value}</div></div>
    </div>
  );
}

export function FloatingInput({ label, as = "input", style, error, autoGrow = false, ...props }) {
  const fieldStyle = {
    ...floatingInput,
    borderColor: error ? "#f87171" : "#b8c7da",
    boxShadow: error ? "0 0 0 3px rgba(248, 113, 113, 0.14)" : "inset 0 0 0 1px rgba(255, 255, 255, 0.22), 0 1px 2px rgba(15, 23, 42, 0.02)",
    ...style
  };
  if (as === "textarea") {
    const textareaMinHeight = style?.minHeight ?? 120;
    return (
      <div style={floatingWrap}>
        <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
        <textarea
          {...props}
          onInput={(event) => {
            if (autoGrow) {
              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${Math.max(event.currentTarget.scrollHeight, Number(textareaMinHeight) || 120)}px`;
            }
            props.onInput?.(event);
          }}
          style={{ ...fieldStyle, minHeight: textareaMinHeight, resize: autoGrow ? "none" : "vertical", overflow: autoGrow ? "hidden" : undefined }}
        />
        {error ? <div style={floatingErrorText}>{error}</div> : null}
      </div>
    );
  }

  if (as === "select") {
    return (
      <div style={floatingWrap}>
        <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
        <select {...props} style={fieldStyle} />
        {error ? <div style={floatingErrorText}>{error}</div> : null}
      </div>
    );
  }

  return (
    <div style={floatingWrap}>
      <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
      <input {...props} style={fieldStyle} />
      {error ? <div style={floatingErrorText}>{error}</div> : null}
    </div>
  );
}

const DatePickerInput = forwardRef(function DatePickerInput({ value, onClick, style, label }, ref) {
  return (
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      readOnly
      style={{ ...datePickerInputBase, cursor: "pointer", ...style }}
      aria-label={label}
    />
  );
});

export function FloatingDateTimePicker({ label, selected, onChange, minDate, error, style, popperPlacement = "bottom-start", popperOffset = 8, popperModifiers }) {
  return (
    <div style={floatingWrap}>
      <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        timeIntervals={15}
        dateFormat="MMM d, yyyy h:mm aa"
        minDate={minDate}
        calendarClassName="followup-datepicker"
        popperPlacement={popperPlacement}
        showPopperArrow={false}
        popperClassName="lead-details-datepicker-popper"
        wrapperClassName="lead-details-datepicker-wrapper"
        popperModifiers={[
          offset(popperOffset),
          ...(popperModifiers || []),
        ]}
        customInput={<DatePickerInput label={label} style={{ borderColor: error ? "#f87171" : "#b8c7da", boxShadow: error ? "0 0 0 3px rgba(248, 113, 113, 0.14)" : "inset 0 0 0 1px rgba(255, 255, 255, 0.22), 0 1px 2px rgba(15, 23, 42, 0.02)", ...style }} />}
      />
      {error ? <div style={floatingErrorText}>{error}</div> : null}
    </div>
  );
}
