import { SystemSettingsModel } from "@/lib/models/systemSettings";
import connect from "@/lib/db";

async function getMaintenanceInfo() {
  await connect();
  const settings = await SystemSettingsModel.findOne();
  return {
    message:
      settings?.message ||
      "The site is currently under maintenance. Please check back soon.",
    until: settings?.until ? new Date(settings.until) : null,
  };
}

export default async function MaintenancePage() {
  const { message, until } = await getMaintenanceInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Maintenance Mode
        </h1>

        <div className="text-gray-600 mb-6">
          <p className="text-lg">{message}</p>
          {until && (
            <p className="mt-4">
              Expected to be back online by{" "}
              <span className="font-medium">
                {until.toLocaleDateString()} at {until.toLocaleTimeString()}
              </span>
            </p>
          )}
        </div>

        <div className="animate-pulse text-blue-600">We'll be back soon!</div>
      </div>
    </div>
  );
}
