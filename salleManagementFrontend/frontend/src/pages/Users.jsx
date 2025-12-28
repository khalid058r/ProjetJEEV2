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
import { useDarkMode } from "../context/DarkModeContext";

export default function Users() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { darkMode } = useDarkMode();

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
      setUsers(res.data.content);
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
      type: "delete",
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
    .filter((u) => (roleFilter === "All" ? true : u.role === roleFilter))
    .filter((u) => {
      if (statusFilter === "Active") return u.active;
      if (statusFilter === "Inactive") return !u.active;
      return true;
    });

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const inactiveUsers = users.filter((u) => !u.active).length;
  const roleCount = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const roles = [
    { value: "ADMIN", label: "Admin", icon: "👑", color: "from-coral-500 to-coral-600" },
    { value: "VENDEUR", label: "Vendeur", icon: "🛒", color: "from-teal-500 to-teal-600" },
    { value: "ANALYSTE", label: "Analyste", icon: "📊", color: "from-arches-500 to-arches-600" },
    { value: "ACHETEUR", label: "Acheteur", icon: "🛍️", color: "from-hof-400 to-hof-500" },
    { value: "INVESTISSEUR", label: "Investisseur", icon: "💼", color: "from-warm-500 to-warm-600" },
  ];

  // Default fallback for unknown roles
  const defaultRole = { label: "Unknown", icon: "👤", color: "from-warm-400 to-warm-500" };
  const getRoleInfo = (roleName) => roles.find((r) => r.value === roleName) || { ...defaultRole, label: roleName || "Unknown" };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-coral-200 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className={`mt-4 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Loading users...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-teal-50/20'}`}>

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-4xl font-bold mb-2 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
              <UserGroupIcon className="h-10 w-10 text-teal-500" />
              User Management
            </h1>
            <p className={darkMode ? 'text-warm-400' : 'text-warm-600'}>Manage system users and permissions</p>
          </div>

          <button
            onClick={() => navigate("/users/new")}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200"
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
            color="coral"
            darkMode={darkMode}
          />
          <StatCard
            icon={<CheckCircleIcon className="h-6 w-6" />}
            label="Active Users"
            value={activeUsers}
            color="teal"
            darkMode={darkMode}
          />
          <StatCard
            icon={<XCircleIcon className="h-6 w-6" />}
            label="Inactive Users"
            value={inactiveUsers}
            color="arches"
            darkMode={darkMode}
          />
          <StatCard
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            label="Admins"
            value={roleCount.ADMIN || 0}
            color="hof"
            darkMode={darkMode}
          />
        </div>

        {/* FILTERS */}
        <div className={`rounded-2xl shadow-sm border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className={`h-5 w-5 absolute left-3 top-3 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`} />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition ${darkMode
                  ? 'bg-warm-800 border-warm-700 text-white placeholder-warm-500'
                  : 'bg-warm-50 border-warm-200 text-warm-900 placeholder-warm-400'
                  }`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`absolute right-3 top-3 ${darkMode ? 'text-warm-500 hover:text-warm-300' : 'text-warm-400 hover:text-warm-600'}`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-teal-500 outline-none transition font-medium text-sm ${darkMode
                ? 'bg-warm-800 border-warm-700 text-white'
                : 'bg-white border-warm-200 text-warm-700'
                }`}
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
              className={`px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-teal-500 outline-none transition font-medium text-sm ${darkMode
                ? 'bg-warm-800 border-warm-700 text-white'
                : 'bg-white border-warm-200 text-warm-700'
                }`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Active Filters */}
          {(search || roleFilter !== "All" || statusFilter !== "All") && (
            <div className={`flex flex-wrap gap-2 mt-4 pt-4 border-t ${darkMode ? 'border-warm-700' : 'border-warm-200'}`}>
              <span className={`text-sm font-medium ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>Active Filters:</span>
              {search && (
                <FilterTag label={`Search: "${search}"`} onRemove={() => setSearch("")} darkMode={darkMode} />
              )}
              {roleFilter !== "All" && (
                <FilterTag label={`Role: ${roleFilter}`} onRemove={() => setRoleFilter("All")} darkMode={darkMode} />
              )}
              {statusFilter !== "All" && (
                <FilterTag label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter("All")} darkMode={darkMode} />
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4">
          <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>
            Showing <span className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{filteredUsers.length}</span> of{" "}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{totalUsers}</span> users
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
          darkMode={darkMode}
        />
      ) : (
        <div className={`rounded-2xl shadow-lg border overflow-hidden ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-warm-800' : 'bg-gradient-to-r from-teal-50 to-warm-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>User</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Role</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Status</th>
                  <th className={`px-6 py-4 text-right text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Actions</th>
                </tr>
              </thead>

              <tbody className={`divide-y ${darkMode ? 'divide-warm-800' : 'divide-warm-100'}`}>
                {filteredUsers.map((u) => {
                  const roleInfo = getRoleInfo(u.role);
                  return (
                    <tr key={u.id} className={`transition ${darkMode ? 'hover:bg-warm-800/50' : 'hover:bg-warm-50'}`}>

                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-coral-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{u.username}</p>
                            <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>{u.email}</p>
                            <p className={`text-xs ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>ID: #{u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${roleInfo.color} text-white rounded-full text-sm font-semibold shadow-sm`}>
                          <span>{roleInfo.icon}</span>
                          <span>{roleInfo.label}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {u.active ? (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700'}`}>
                            <CheckCircleIcon className="h-4 w-4" />
                            Active
                          </div>
                        ) : (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${darkMode ? 'bg-coral-500/20 text-coral-400' : 'bg-coral-100 text-coral-700'}`}>
                            <XCircleIcon className="h-4 w-4" />
                            Inactive
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}`)}
                            className={`p-2 rounded-xl transition ${darkMode ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                            title="Edit User"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>

                          {u.active ? (
                            <button
                              onClick={() => handleDeactivate(u.id, u.username)}
                              className={`p-2 rounded-xl transition ${darkMode ? 'bg-hof-400/20 text-hof-400 hover:bg-hof-400/30' : 'bg-hof-50 text-hof-600 hover:bg-hof-100'}`}
                              title="Deactivate User"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(u.id, u.username)}
                              className={`p-2 rounded-xl transition ${darkMode ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                              title="Activate User"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className={`p-2 rounded-xl transition ${darkMode ? 'bg-coral-500/20 text-coral-400 hover:bg-coral-500/30' : 'bg-coral-50 text-coral-600 hover:bg-coral-100'}`}
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
          <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'bg-warm-800 border-warm-700' : 'bg-warm-50 border-warm-100'}`}>
            <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>
              Page <span className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{pageInfo.number + 1}</span> of{" "}
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{pageInfo.totalPages}</span>
            </p>

            <div className="flex gap-2">
              <button
                disabled={pageInfo.first}
                onClick={() => loadUsers(pageInfo.number - 1)}
                className={`px-4 py-2 rounded-xl border-2 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${darkMode
                  ? 'bg-warm-700 border-warm-600 text-white hover:bg-warm-600'
                  : 'bg-white border-warm-200 text-warm-700 hover:bg-warm-50'
                  }`}
              >
                Previous
              </button>

              <button
                disabled={pageInfo.last}
                onClick={() => loadUsers(pageInfo.number + 1)}
                className={`px-4 py-2 rounded-xl border-2 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${darkMode
                  ? 'bg-warm-700 border-warm-600 text-white hover:bg-warm-600'
                  : 'bg-white border-warm-200 text-warm-700 hover:bg-warm-50'
                  }`}
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

function StatCard({ icon, label, value, color, darkMode }) {
  const colorClasses = {
    coral: { icon: "from-coral-500 to-coral-600", text: "text-coral-500" },
    teal: { icon: "from-teal-500 to-teal-600", text: "text-teal-500" },
    arches: { icon: "from-arches-500 to-arches-600", text: "text-arches-500" },
    hof: { icon: "from-hof-400 to-hof-500", text: "text-hof-500" },
  };

  const colors = colorClasses[color] || colorClasses.coral;

  return (
    <div className={`rounded-2xl shadow-sm border p-5 transition-all hover:shadow-lg ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'
      }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.icon} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <p className={`text-sm mb-1 ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>{label}</p>
      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{value}</p>
    </div>
  );
}

function FilterTag({ label, onRemove, darkMode }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700'
      }`}>
      {label}
      <button onClick={onRemove} className={darkMode ? 'hover:text-teal-300' : 'hover:text-teal-900'}>
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({ hasFilters, onReset, darkMode }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-warm-900 border-warm-700' : 'bg-white border-warm-300'
      }`}>
      <UserGroupIcon className={`h-16 w-16 mb-4 ${darkMode ? 'text-warm-600' : 'text-warm-300'}`} />
      <p className={`text-lg mb-2 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
        {hasFilters ? "No users found" : "No users yet"}
      </p>
      <p className={`text-sm mb-6 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
        {hasFilters ? "Try adjusting your filters" : "Get started by adding your first user"}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition shadow-lg"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}