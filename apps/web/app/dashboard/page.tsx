import { redirect } from 'next/navigation';

export default function DashboardPage() {
    // In a real app, you would check the user's role and redirect accordingly
    // For this demo, we'll default to the landowner dashboard
    redirect('/dashboard/landowner');
}
