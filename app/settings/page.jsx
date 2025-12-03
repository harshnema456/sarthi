export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Profile Information</h3>
            <p className="text-sm text-muted-foreground">Update your profile details and personal information.</p>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-medium">Security</h3>
            <p className="text-sm text-muted-foreground">Change your password and manage security settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
