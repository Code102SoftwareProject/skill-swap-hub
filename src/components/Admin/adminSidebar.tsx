export default function AdminSidebar() {
    return (
        <div className="admin-sidebar">
            
            <div className="admin-sidebar__content font-heading font-bold text-gray-400 text-xl text-left">
                <ul>
                    <li className="ml-20 mt-5">Dashboard</li>
                    <li className="ml-20 mt-5">KYC</li>
                    <li className="ml-20 mt-5">Users</li>
                    <li className="ml-20 mt-5">Suggestion</li>
                    <li className="ml-20 mt-5">System</li>
                    <li className="ml-20 mt-5">Verify Document</li>
                    <li className="ml-20 mt-5">Reporting</li>
                </ul>
            </div>
        </div>
    );
}