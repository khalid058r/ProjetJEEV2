import { useEffect, useState } from "react";
import {
  getUsersPage,
  activateUser,
  deactivateUser,
  deleteUser,
} from "../services/userService";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Users() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmAction, setConfirmAction] = useState(null);

  const loadUsers = async (page = 0) => {
    try {
      setLoading(true);
      const res = await getUsersPage(page, 10);
      setUsers(res. data.content);
      setPageInfo(res.data);
    } catch (err) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleActivate = async (id, username) => {
    setConfirmAction({
      type: "activate",
      id,
      title: "Activate User",
      message: `Are you sure you want to activate ${username}?`,
      action: async () => {
        try {
          await activateUser(id);
          showToast("User activated successfully", "success");
          loadUsers(pageInfo.number);
        } catch (err) {
          showToast("Failed to activate user", "error");
        }
      },
    });
  };

  const handleDeactivate = async (id, username) => {
    setConfirmAction({
      type: "deactivate",
      id,
      title: "Deactivate User",
      message: `Are you sure you want to deactivate ${username}?  They won't be able to log in. `,
      action: async () => {
        try {
          await deactivateUser(id);
          showToast("User deactivated successfully", "success");
          loadUsers(pageInfo.number);
        } catch (err) {
          showToast("Failed to deactivate user", "error");
        }
      },
    });
  };

  const handleDelete = async (id, username) => {
    setConfirmAction({
      type:  "delete",
      id,
      title: "Delete User",
      message: `Are you sure you want to permanently delete ${username}?  This action cannot be undone.`,
      action: async () => {
        try {
          await deleteUser(id);
          showToast("User deleted successfully", "success");
          loadUsers(0);
        } catch (err) {
          showToast("Failed to delete user", "error");
        }
      },
    });
  };

  // Filtering
  const filteredUsers = users
    .filter((u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) => (roleFilter === "All" ?  true : u.role === roleFilter))
    .filter((u) => {
      if (statusFilter === "Active") return u.active;
      if (statusFilter === "Inactive") return !u.active;
      return true;
    });

  // Stats
  const totalUsers = users. length;
  const activeUsers = users.filter((u) => u.active).length;
  const inactiveUsers = users.filter((u) => !u.active).length;
  const roleCount = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const roles = [
    { value: "ADMIN", label: "Admin", icon: "👑", color: "from-red-500 to-pink-500" },
    { value: "VENDEUR", label:  "Vendeur", icon: "🛒", color: "from-green-500 to-emerald-500" },
    { value: "ANALYSTE", label: "Analyste", icon:  "📊", color: "from-blue-500 to-cyan-500" },
    { value: "ACHETEUR", label: "Acheteur", icon: "🛍️", color: "from-purple-500 to-pink-500" },
    { value: "INVESTISSEUR", label: "Investisseur", icon: "💼", color: "from-orange-500 to-red-500" },
  ];

  const getRoleInfo = (roleName) => roles.find((r) => r.value === roleName) || {};

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 p-8">
      
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <UserGroupIcon className="h-10 w-10 text-purple-600" />
              User Management
            </h1>
            <p className="text-gray-600">Manage system users and permissions</p>
          </div>

          <button
            onClick={() => navigate("/users/new")}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-semibold">Add User</span>
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<UserGroupIcon className="h-6 w-6" />}
            label="Total Users"
            value={totalUsers}
            color="blue"
          />
          <StatCard
            icon={<CheckCircleIcon className="h-6 w-6" />}
            label="Active Users"
            value={activeUsers}
            color="green"
          />
          <StatCard
            icon={<XCircleIcon className="h-6 w-6" />}
            label="Inactive Users"
            value={inactiveUsers}
            color="red"
          />
          <StatCard
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            label="Admins"
            value={roleCount.ADMIN || 0}
            color="purple"
          />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-gray-400 hover: text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2. 5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white font-medium text-sm"
            >
              <option value="All">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white font-medium text-sm"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Active Filters */}
          {(search || roleFilter !== "All" || statusFilter !== "All") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
              {search && (
                <FilterTag label={`Search: "${search}"`} onRemove={() => setSearch("")} />
              )}
              {roleFilter !== "All" && (
                <FilterTag label={`Role: ${roleFilter}`} onRemove={() => setRoleFilter("All")} />
              )}
              {statusFilter !== "All" && (
                <FilterTag label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter("All")} />
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredUsers. length}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalUsers}</span> users
          </p>
        </div>
      </div>

      {/* TABLE */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          hasFilters={search || roleFilter !== "All" || statusFilter !== "All"}
          onReset={() => {
            setSearch("");
            setRoleFilter("All");
            setStatusFilter("All");
          }}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers. map((u) => {
                  const roleInfo = getRoleInfo(u. role);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                            {u.username. charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.username}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                            <p className="text-xs text-gray-400">ID: #{u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${roleInfo.color} text-white rounded-full text-sm font-semibold shadow-sm`}>
                          <span>{roleInfo.icon}</span>
                          <span>{roleInfo. label}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {u.active ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            <CheckCircleIcon className="h-4 w-4" />
                            Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                            <XCircleIcon className="h-4 w-4" />
                            Inactive
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/users/${u.id}`)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                            title="Edit User"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>

                          {u.active ?  (
                            <button
                              onClick={() => handleDeactivate(u.id, u.username)}
                              className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition"
                              title="Deactivate User"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(u.id, u.username)}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                              title="Activate User"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(u.id, u. username)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="Delete User"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page <span className="font-semibold">{pageInfo.number + 1}</span> of{" "}
              <span className="font-semibold">{pageInfo.totalPages}</span>
            </p>

            <div className="flex gap-2">
              <button
                disabled={pageInfo.first}
                onClick={() => loadUsers(pageInfo.number - 1)}
                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled: cursor-not-allowed transition font-semibold"
              >
                Previous
              </button>

              <button
                disabled={pageInfo.last}
                onClick={() => loadUsers(pageInfo.number + 1)}
                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Confirm"
          onConfirm={async () => {
            await confirmAction.action();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

/* -----------------------------------------
    COMPONENTS
------------------------------------------ */

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue:  "text-blue-600 bg-blue-50 border-blue-200",
    green: "text-green-600 bg-green-50 border-green-200",
    red: "text-red-600 bg-red-50 border-red-200",
    purple:  "text-purple-600 bg-purple-50 border-purple-200",
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 p-5 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
      {label}
      <button onClick={onRemove} className="hover:text-purple-900">
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
      <UserGroupIcon className="h-16 w-16 text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg mb-2">
        {hasFilters ? "No users found" : "No users yet"}
      </p>
      <p className="text-gray-400 text-sm mb-6">
        {hasFilters ?  "Try adjusting your filters" :  "Get started by adding your first user"}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}