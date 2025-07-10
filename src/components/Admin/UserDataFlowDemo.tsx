import React from "react";

// This component demonstrates how user data flows from the ReportInSession schema to the UI
const UserDataFlowDemo = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg border">
      <h2 className="text-xl font-bold mb-4">
        User Data Flow in Admin Reports
      </h2>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">
            1. Database Schema (ReportInSession)
          </h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {`{
  reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reportedUser: { type: Schema.Types.ObjectId, ref: "User" },
  // ... other fields
}`}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">
            2. API Population (/api/admin/reports)
          </h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {`await ReportInSession.find({})
  .populate({
    path: "reportedBy",
    select: "firstName lastName email",
    model: "User",
  })
  .populate({
    path: "reportedUser", 
    select: "firstName lastName email",
    model: "User",
  })`}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">3. TypeScript Interface</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {`interface AdminReport {
  reportedBy: AdminReportUser;
  reportedUser: AdminReportUser;
  // ...
}

interface AdminReportUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}`}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">4. React Component Usage</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {`// In table cell:
{report.reportedBy?.firstName} {report.reportedBy?.lastName}
{report.reportedBy?.email}

// In modal:
{selectedReport.reportedUser?.firstName} {selectedReport.reportedUser?.lastName}
{selectedReport.reportedUser?.email}`}
          </pre>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800 mb-2">
          ✅ Current Implementation Status
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✅ Database schema correctly references User model</li>
          <li>✅ API endpoint properly populates user data</li>
          <li>✅ TypeScript interfaces match the data structure</li>
          <li>✅ React component displays user information</li>
          <li>✅ Both table and modal show complete user details</li>
        </ul>
      </div>
    </div>
  );
};

export default UserDataFlowDemo;
