import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="p-4 md:pl-72 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl font-semibold text-charcoal mb-2">
          Welcome Back!
        </h1>
        <p className="text-charcoal-light">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: "0", icon: "📦", color: "bg-honey/10 text-honey-dark" },
          { label: "Revenue", value: "$0", icon: "💰", color: "bg-sage/10 text-sage-dark" },
          { label: "Products", value: "0", icon: "🧼", color: "bg-lavender/20 text-charcoal" },
          { label: "Pending", value: "0", icon: "⏳", color: "bg-rose/20 text-charcoal" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/admin/products"
            className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-honey rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-charcoal">Add New Product</p>
              <p className="text-sm text-charcoal-light">Create a new soap listing</p>
            </div>
          </Link>
          
          <Link 
            href="/admin/orders"
            className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-sage rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-charcoal">View Orders</p>
              <p className="text-sm text-charcoal-light">Manage pending shipments</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-4">
          Recent Orders
        </h2>
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-charcoal-light mb-2">No orders yet</p>
          <p className="text-sm text-charcoal-light">
            When customers place orders, they&apos;ll appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

