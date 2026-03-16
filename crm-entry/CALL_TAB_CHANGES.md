# Call Tab Changes

This note explains the changes made to the lead details Call tab so you can follow the frontend pattern and reuse it later.

## File changed

- `src/salesCRM/components/LeadDetailsModal.jsx`

## What changed

### 1. Separate subtabs for call actions

Inside the Calls tab, the old single mode dropdown was replaced with two small action tabs:

- `Log Call`
- `Schedule Call`

Why:

- Logging a completed call and scheduling a future call use different backend payloads.
- Splitting them makes the UI easier to understand and reduces the chance of sending the wrong fields.

Implementation idea:

- The state still uses `callMode`
- The UI now changes `callMode` through buttons instead of a select

## 2. Floating labels for the call form

A reusable helper component called `FloatingInput` was added.

It supports:

- `input`
- `select`
- `textarea`

Why:

- Users can always see what each field means
- The label stays visible even after the field is filled

Implementation idea:

- Wrap each field in a relatively positioned container
- Render a small label absolutely near the top
- Add extra top padding inside the field so text does not overlap the label

## 3. Expanded call payload

The Call tab now sends more fields to match the backend Swagger examples.

Shared fields:

- `leadId`
- `subject`
- `callType`
- `callStatus`
- `callStartTime`
- `assignedToUserId`
- `callPurpose`
- `callAgenda`

For `POST /Activities/call/log`:

- `callResult`
- `description`
- `voiceRecordingUrl`
- `durationMinutes`

For `POST /Activities/call/schedule`:

- `reminder`

Why:

- The backend exposes different contracts for logged calls and scheduled calls
- Sending only relevant fields keeps the request cleaner

## 4. Calls history now reads from activities

The Calls history panel now maps call items from open and closed activities instead of depending only on lead communications.

Why:

- Call saves are going through the activities endpoints
- If the history only reads communications, the user may save a call but not see it in the Calls tab

Implementation idea:

- Build `callHistory` from `open` and `closed`
- Filter activity items where `type` contains `call`
- Map them into the same shape the history list expects

## 5. Middle panel scrolling

The middle section was adjusted so:

- the top tab strip stays fixed in the panel layout
- the content area below it is the part that scrolls

Why:

- This gives a cleaner experience when forms become tall
- It prevents the whole modal section from feeling cramped

Implementation idea:

- Keep the outer section as a flex column
- Make the tab header `flexShrink: 0`
- Make the content area `flex: 1`, `minHeight: 0`, and `overflowY: auto`

## How to repeat this pattern later

If you add another activity type:

1. Add the new form fields to component state
2. Separate shared payload fields from endpoint-specific fields
3. Build small reusable UI helpers when the form starts repeating structure
4. Make sure the history view reads from the same backend source used for saving

## Good next improvement

Add field validation before submit, for example:

- require `subject`
- require `callStartTime`
- require `callResult` only for logged calls
- require `reminder` only if your business rules need it for scheduled calls
