import React, { useState, useEffect, useMemo, useCallback } from "react";
import UserDetailModal from "../components/UserDetailModal";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import {
  fetchUsers,
  fetchRoles,
  updateUser as persistUser,
} from "../services/apiClient";

const DEFAULT_ROLE_OPTIONS = ["Admin", "Plant Researcher", "User"];

const buildRoleMetadata = (rolesList) => {
  const nameToId = {};
  const idToName = {};
  const options = [];

  const register = (name, id) => {
    if (!name && name !== 0) return;
    if (id == null) return;
    const normalizedName = String(name).trim();
    if (!normalizedName) return;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return;

    idToName[numericId] = normalizedName;
    nameToId[normalizedName] = numericId;
    nameToId[normalizedName.toLowerCase()] = numericId;
    if (!options.includes(normalizedName)) {
      options.push(normalizedName);
    }
  };

  if (Array.isArray(rolesList) && rolesList.length > 0) {
    rolesList.forEach((role) =>
      register(role?.role_name, role?.role_id)
    );
  }

  if (options.length === 0) {
    DEFAULT_ROLE_OPTIONS.forEach((roleName, index) =>
      register(roleName, index + 1)
    );
  }

  return { nameToId, idToName, options };
};

const decorateUsers = (apiUsers, idToName) => {
  if (!Array.isArray(apiUsers)) return [];

  return apiUsers.map((user) => {
    const roleId =
      typeof user.role_id === "number" || typeof user.role_id === "string"
        ? Number(user.role_id)
        : null;
    const resolvedRole =
      (typeof user.role_name === "string" && user.role_name.trim()) ||
      (roleId != null ? idToName[roleId] : null) ||
      "Unknown";
    const activeField =
      user.is_active ?? user.active ?? user.status ?? true;

    return {
      ...user,
      role_id: roleId,
      role: resolvedRole,
      active: Boolean(activeField),
      email: user.email ?? "",
      phone: user.phone ?? "",
    };
  });
};

const buildUpdatePayload = (user) => ({
  username: user.username,
  email: user.email,
  role_id: user.role_id,
  avatar_url: user.avatar_url ?? null,
  phone: user.phone ?? null,
  is_active: user.active ? 1 : 0,
});

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleMenu, setRoleMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredDropdownItem, setHoveredDropdownItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rolesMeta, setRolesMeta] = useState(() =>
    buildRoleMetadata([])
  );
  const [updatingMap, setUpdatingMap] = useState({});

  const roleOptions = rolesMeta.options;
  const roleNameToId = rolesMeta.nameToId;
  const idToRoleName = rolesMeta.idToName;

  const markUpdating = useCallback((userId, value) => {
    setUpdatingMap((prev) => {
      const next = { ...prev };
      if (value) {
        next[userId] = true;
      } else {
        delete next[userId];
      }
      return next;
    });
  }, []);

  const isUserBusy = useCallback(
    (userId) => Boolean(updatingMap[userId]),
    [updatingMap]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [rolesResponse, usersResponse] = await Promise.all([
        fetchRoles().catch((err) => {
          console.warn("Failed to load roles:", err);
          return [];
        }),
        fetchUsers(),
      ]);

      const metadata = buildRoleMetadata(rolesResponse);
      const decoratedUsers = decorateUsers(usersResponse, metadata.idToName);

      setRolesMeta(metadata);
      setUsers(decoratedUsers);
      setSelectedUser((prev) => {
        if (!prev) return prev;
        return (
          decoratedUsers.find((user) => user.user_id === prev.user_id) || prev
        );
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const applyOptimisticUpdate = useCallback((userId, updatedUser) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.user_id === userId ? { ...user, ...updatedUser } : user
      )
    );
    setSelectedUser((prev) => {
      if (prev && prev.user_id === userId) {
        return { ...prev, ...updatedUser };
      }
      return prev;
    });
  }, []);

  const revertUserUpdate = useCallback((snapshot) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.user_id === snapshot.user_id ? { ...snapshot } : user
      )
    );
    setSelectedUser((prev) => {
      if (prev && prev.user_id === snapshot.user_id) {
        return { ...snapshot };
      }
      return prev;
    });
  }, []);

  const runUserUpdate = useCallback(
    async (userId, updater, errorMessage) => {
      const currentUser = users.find((user) => user.user_id === userId);
      if (!currentUser) return false;

      const snapshot = { ...currentUser };
      const nextUser =
        typeof updater === "function"
          ? updater({ ...snapshot })
          : { ...snapshot, ...updater };

      if (!nextUser || typeof nextUser !== "object") {
        return false;
      }

      applyOptimisticUpdate(userId, nextUser);
      markUpdating(userId, true);
      setError(null);

      try {
        await persistUser(userId, buildUpdatePayload(nextUser));
        return true;
      } catch (err) {
        console.error(err);
        setError(errorMessage);
        revertUserUpdate(snapshot);
        return false;
      } finally {
        markUpdating(userId, false);
      }
    },
    [applyOptimisticUpdate, markUpdating, revertUserUpdate, users]
  );

  const updateStatus = useCallback(
    async (userId, nextValue = null) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user) return false;
      if (isUserBusy(userId)) return false;

      const desiredValue =
        nextValue == null ? !user.active : Boolean(nextValue);

      if (desiredValue === user.active) {
        return true;
      }

      return runUserUpdate(
        userId,
        (current) => ({
          ...current,
          active: desiredValue,
        }),
        "Failed to update user status."
      );
    },
    [users, isUserBusy, runUserUpdate]
  );

  const changeRole = useCallback(
    async (userId, roleName) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user) return false;
      if (isUserBusy(userId)) return false;

      const candidate =
        typeof roleName === "string" ? roleName.trim() : roleName;
      const roleId =
        candidate != null
          ? roleNameToId[candidate] ??
            (typeof candidate === "string"
              ? roleNameToId[candidate.toLowerCase()]
              : undefined)
          : undefined;

      if (!roleId) {
        setError("Unknown role selected.");
        return false;
      }

      if (user.role === candidate && user.role_id === roleId) {
        setRoleMenu(null);
        setHoveredDropdownItem(null);
        return true;
      }

      const updatedRoleName =
        typeof candidate === "string" && candidate.length > 0
          ? candidate
          : idToRoleName[roleId] ?? candidate;

      const success = await runUserUpdate(
        userId,
        (current) => ({
          ...current,
          role: updatedRoleName,
          role_id: roleId,
        }),
        "Failed to update user role."
      );

      if (success) {
        setRoleMenu(null);
        setHoveredDropdownItem(null);
      }

      return success;
    },
    [users, isUserBusy, roleNameToId, idToRoleName, runUserUpdate]
  );

  // Search functionality from mobile
  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return users
      .filter((user) => {
        if (!normalizedQuery) return true;
        return (
          user.username.toLowerCase().includes(normalizedQuery) ||
          (user.email || "").toLowerCase().includes(normalizedQuery) ||
          String(user.phone ?? "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          String(user.user_id).includes(normalizedQuery)
        );
      })
      .sort((a, b) => a.user_id - b.user_id); // Changed to sort by user_id in ascending order
  }, [searchQuery, users]);

  const getDropdownItemStyle = (role) => {
    const baseStyle = {
      padding: "10px 12px",
      cursor: "pointer",
      borderBottom: "1px solid #f1f1f1",
      fontSize: "13px",
    };
    
    if (hoveredDropdownItem === role) {
      return {
        ...baseStyle,
        backgroundColor: "#F8FAFC"
      };
    }
    
    return baseStyle;
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.pageTitle}>User Directory</h2>
      <p style={styles.pageSubtitle}>
        Manage administrator and researcher accounts. All actions sync with backend & database.
      </p>

      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button style={styles.retryButton} onClick={loadUsers}>
            Retry
          </button>
        </div>
      )}

      {loading && users.length > 0 && (
        <div style={styles.syncingText}>Refreshing users...</div>
      )}

      {/* Search Bar from mobile */}
      <div style={styles.searchBar}>
        <SearchIcon style={styles.searchIcon} />
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Search by username, email, phone, or ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery.length > 0 && (
          <button
            style={styles.clearButton}
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User ID</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.loadingState}>
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyState}>
                  <div style={styles.emptyStateContent}>
                    <PeopleIcon style={styles.emptyStateIcon} />
                    <p style={styles.emptyStateText}>
                      No users found. Try a different search.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const busy = isUserBusy(user.user_id);
                return (
                  <tr key={user.user_id}>
                    <td style={styles.td}>{user.user_id}</td>
                    <td style={styles.td}>
                      <span style={!user.active ? styles.usernameInactive : {}}>
                        {user.username}
                      </span>
                    </td>
                    <td style={styles.td}>{user.email || "—"}</td>
                    <td style={styles.td}>{user.phone || "—"}</td>

                    {/* Role Dropdown */}
                    <td style={styles.td}>
                      <div style={styles.roleColumn}>
                        <button
                          style={{
                            ...styles.roleBtn,
                            opacity: busy ? 0.6 : 1,
                            cursor: busy ? "not-allowed" : "pointer",
                          }}
                          disabled={busy}
                          onClick={() => {
                            if (busy) return;
                            setRoleMenu(
                              roleMenu === user.user_id ? null : user.user_id
                            );
                          }}
                        >
                          {busy ? "Saving..." : `${user.role} ▼`}
                        </button>

                        {roleMenu === user.user_id && (
                          <div style={styles.dropdown}>
                            {roleOptions.map((option) => (
                              <div
                                key={option}
                                style={getDropdownItemStyle(option)}
                                onMouseEnter={() => setHoveredDropdownItem(option)}
                                onMouseLeave={() => setHoveredDropdownItem(null)}
                                onClick={() => {
                                  if (busy) return;
                                  changeRole(user.user_id, option);
                                }}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Centered status text + toggle */}
                    <td style={styles.td}>
                      <div style={styles.statusContainer}>
                        <div style={styles.statusText}>
                          {busy
                            ? "Updating..."
                            : user.active
                            ? "Active"
                            : "Inactive"}
                        </div>

                        <div
                          style={{
                            ...styles.toggle,
                            backgroundColor: user.active ? "#3AA272" : "#D0D7DD",
                            opacity: busy ? 0.5 : 1,
                            cursor: busy ? "not-allowed" : "pointer",
                          }}
                          onClick={() => {
                            if (busy) return;
                            updateStatus(user.user_id);
                          }}
                        >
                          <div
                            style={{
                              ...styles.toggleCircle,
                              marginLeft: user.active ? "22px" : "2px",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Centered View button */}
                    <td style={styles.td}>
                      <button
                        style={styles.viewBtn}
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Enhanced User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          roleOptions={roleOptions}
          onChangeRole={changeRole}
          onChangeActive={updateStatus}
          isBusy={isUserBusy(selectedUser.user_id)}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    backgroundColor: "#F5F6F8",
    minHeight: "100vh",
  },

  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1E2D3D",
    marginBottom: "8px",
  },

  pageSubtitle: {
      fontSize: "14px",
      marginBottom: "20px",
      color: "#566573",
    },

  errorBanner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "10px",
      backgroundColor: "#FEE2E2",
      color: "#7F1D1D",
      border: "1px solid #FCA5A5",
      marginBottom: "16px",
    },

  retryButton: {
      padding: "6px 12px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#1E88E5",
      color: "#fff",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },

  syncingText: {
      fontSize: "12px",
      color: "#64748B",
      marginBottom: "8px",
    },

  // Search bar styles from mobile
  searchBar: {
    marginTop: "16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    height: "44px",
    borderRadius: "14px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    gap: "8px",
    maxWidth: "400px",
  },

  searchIcon: {
    fontSize: "20px",
    color: "#64748B",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#0F172A",
    background: "transparent",
  },

  clearButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "#94A3B8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  tableWrapper: {
    marginTop: "20px",
    overflowX: "auto",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "center", // Changed to center align table headers
    padding: "16px",
    background: "#EBEEF2",
    fontWeight: "600",
    fontSize: "14px",
    color: "#1E2D3D",
  },

  td: {
    textAlign: "center", // Changed to center align table data
    padding: "16px",
    borderBottom: "1px solid #E7EAF0",
    fontSize: "14px",
    verticalAlign: "middle",
  },

  // Username inactive style from mobile
  usernameInactive: {
    color: "#9CA3AF",
  },

  // Empty state styles from mobile
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
  },

  emptyStateContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },

  emptyStateIcon: {
    fontSize: "48px",
    color: "#94A3B8",
  },

  emptyStateText: {
      fontSize: "14px",
      color: "#64748B",
      margin: 0,
    },

  loadingState: {
      padding: "40px 20px",
      textAlign: "center",
      fontSize: "14px",
      color: "#475569",
    },

  // Role button + dropdown
  roleColumn: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },

  roleBtn: {
    padding: "8px 12px",
    background: "#E5ECF3",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "#23364B",
  },

  dropdown: {
    position: "absolute",
    top: "38px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#fff",
    border: "1px solid #E2E8F0",
    width: "160px",
    borderRadius: "8px",
    zIndex: 10,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },

  // Status toggle
  statusContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },

  statusText: {
    fontSize: "13px",
    fontWeight: 600,
  },

  toggle: {
    width: "44px",
    height: "22px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "0.2s",
  },

  toggleCircle: {
    width: "18px",
    height: "18px",
    background: "#fff",
    borderRadius: "50%",
    transition: "0.2s",
  },

  // View button
  viewBtn: {
    padding: "8px 16px",
    background: "#1E88E5",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },
};