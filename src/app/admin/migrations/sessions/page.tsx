import { Metadata } from 'next';
import MigrateSessionSchema from '@/components/Admin/MigrateSessionSchema';

export const metadata: Metadata = {
  title: 'Session Schema Migration',
  description: 'Migrate session schema to add rejected status and tracking',
};

export default function MigrateSessionSchemaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Session Schema Migration</h1>
      <MigrateSessionSchema />
    </div>
  );
}
