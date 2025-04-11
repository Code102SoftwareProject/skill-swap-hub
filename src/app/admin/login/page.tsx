import Form from 'next/form'

export default function Login() {
    return (
        <main className="bg-secondary px-40 py-60 flex items-center justify-center min-h-screen">
            <div className="flex flex-row max-w-6xl mx-auto bg-white rounded-xl shadow-lg w-full">
                {/* Image Container */}
                <div className="w-1/2">
                    <img
              src="/loginpageimage.jpg" 
            
                        alt="Login Image"
                        className="w-full h-full object-cover rounded-l-xl shadow-md"
                    />
                </div>
                {/* Form Container */}
                <div className="w-1/2 p-8">
                    <h2 className="text-xl font-semibold mb-6">Admin Login</h2>
                    <Form action="/onsubmit" className="space-y-4">
                        <div>
                            <label htmlFor="Username" className="block text-sm font-medium text-gray-700">Username</label>
                            <input id="Username" name="Username" placeholder="Username" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input id="password" name="password" type="password" placeholder="Password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <input type="checkbox"/> Remember me
                        </div>
                        <button type="submit" className="w-full bg-primary hover:bg-buttonHover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Login</button>
                        <div>
                            <a href="">Forget Password</a>
                        </div>
                    </Form>
                </div>
            </div>
        </main>
    );
}
