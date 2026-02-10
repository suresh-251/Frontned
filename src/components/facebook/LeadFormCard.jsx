import Card from "../common/Card";
import Badge from "../common/Badge";

export default function LeadFormCard({
  form,
  onToggle,
  onSync
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        {/* Form Info */}
        <div className="flex items-start gap-4 flex-1">
          {/* Form Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* Form Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {form.name}
              </h3>
              {form.isEnabled ? (
                <Badge variant="success">
                  <svg className="w-3 h-3 mr-1 inline-block" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Enabled
                </Badge>
              ) : (
                <Badge variant="default">
                  <svg className="w-3 h-3 mr-1 inline-block" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Disabled
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Created: {new Date(form.created_time).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {/* Enable/Disable Toggle */}
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={() => onToggle(form)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {form.isEnabled ? "Enabled" : "Enable"}
            </span>
          </label>

          {/* Sync Button */}
          <button
            onClick={() => onSync(form.id)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Old Leads
          </button>
        </div>
      </div>
    </Card>
  );
}
