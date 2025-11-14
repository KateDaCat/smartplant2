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

const deriveRoleLookups = (rolesList) => {
  const nameToId = {};
  const idToName = {};
  const options = [];

  const register = (rawName, rawId) => {
    if (!rawName || rawId == null) {
      return;
    }
    const name = String(rawName).trim();
    if (!name) return;
    const id = Number(rawId);
    idToName[id] = name;
    nameToId[name] = id;
    nameToId[name.toLowerCase()] = id;
    if (!options.includes(name)) {
      options.push(name);
    }
  };

  if (Array.isArray(rolesList) && rolesList.length > 0) {
    rolesList.forEach((role) => register(role?.role_name, role?.role_id));
  } else {
    DEFAULT_ROLE_OPTIONS.forEach((roleName, index) => register(roleName, index + 1));
  }

  return { nameToId, idToName, options };
};

const decorateUsersWithRoles = (rolesList, apiUsers) => {
  const { idToName } = deriveRoleLookups(rolesList);

  return Array.isArray(apiUsers)
    ? apiUsers.map((user) => {
        const roleId =
          typeof user.role_id === "number" || typeof user.role_id === "string"
            ? Number(user.role_id)
            : null;
        const resolvedRole =
          user.role_name ||
          (roleId != null ? idToName[roleId] : null) ||
          "Unknown";
        const isActiveRaw =
          typeof user.is_active === "boolean" ||
          typeof user.is_active === "number"
            ? user.is_active
            : user.active;

        return {
          ...user,
          role_id: roleId,
          role: resolvedRole,
          active: Boolean(isActiveRaw ?? true),
        };
      })
    : [];
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleMenu, setRoleMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredDropdownItem, setHoveredDropdownItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [busyUserIds, setBusyUserIds] = useState({});

  const { nameToId: roleNameToId, options: roleOptions } =
    useMemo(() => deriveRoleLookups(roles), [roles]);

  const buildUpdatePayload = useCallback((user) => {
    return {
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      avatar_url: user.avatar_url ?? null,
      phone: user.phone ?? null,
      is_active: user.active ? 1 : 0,
    };
  }, []);

  const applyUserUpdate = useCallback((userId, updater) => {
    let previousUser = null;
    let nextUser = null;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.user_id !== userId) return user;
        previousUser = user;
        nextUser = updater(user);
        return nextUser;
      })
    );

    setSelectedUser((prev) => {
      if (prev && prev.user_id === userId && nextUser) {
        return nextUser;
      }
      return prev;
    });

    return { previousUser, nextUser };
  }, []);

  const withUserUpdate = useCallback(
    async (userId, updater, { errorMessage }) => {
      const { previousUser, nextUser } = applyUserUpdate(userId, updater);
      if (!nextUser || !previousUser) {
        return false;
      }

      setBusyUserIds((prev) => ({ ...prev, [userId]: true }));
      setError(null);

      try {
        await persistUser(userId, buildUpdatePayload(nextUser));
        return true;
      } catch (err) {
        console.error(err);
        setError(errorMessage || "Unable to update user right now.");
        applyUserUpdate(userId, () => previousUser);
        return false;
      } finally {
        setBusyUserIds((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    },
    [applyUserUpdate, buildUpdatePayload]
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

      const rolesData = Array.isArray(rolesResponse) ? rolesResponse : [];
      const decorated = decorateUsersWithRoles(
        rolesData,
        Array.isArray(usersResponse) ? usersResponse : []
      );

      setRoles(rolesData);
      setUsers(decorated);

      setSelectedUser((prev) => {
        if (!prev) return prev;
        const refreshed = decorated.find(
          (user) => user.user_id === prev.user_id
        );
        return refreshed || prev;
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

  const updateStatus = useCallback(
    (userId, nextValue = null) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user) return Promise.resolve(false);
      if (busyUserIds[userId]) return Promise.resolve(false);

      const desiredValue =
        nextValue == null ? !user.active : Boolean(nextValue);

      if (desiredValue === user.active) {
        return Promise.resolve(true);
      }

      return withUserUpdate(
        userId,
        (current) => ({
          ...current,
          active: desiredValue,
          is_active: desiredValue ? 1 : 0,
        }),
        { errorMessage: "Failed to update user status." }
      );
    },
    [users, busyUserIds, withUserUpdate]
  );

  const changeRole = useCallback(
    (userId, roleName) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user) return Promise.resolve(false);
      if (busyUserIds[userId]) return Promise.resolve(false);

    const normalizedRoleName =
      typeof roleName === "string" ? roleName.trim() : roleName;
    const roleId =
      normalizedRoleName != null
        ? roleNameToId[normalizedRoleName] ??
          (typeof normalizedRoleName === "string"
            ? roleNameToId[normalizedRoleName.toLowerCase()]
            : undefined)
        : undefined;
      if (!roleId) {
        setError("Unknown role selected.");
        return Promise.resolve(false);
      }

      if (user.role === roleName && user.role_id === roleId) {
        setRoleMenu(null);
        setHoveredDropdownItem(null);
        return Promise.resolve(true);
      }

      return withUserUpdate(
        userId,
        (current) => ({
          ...current,
          role: roleName,
          role_id: roleId,
        }),
        { errorMessage: "Failed to update user role." }
      ).then((success) => {
        if (success) {
          setRoleMenu(null);
          setHoveredDropdownItem(null);
        }
        return success;
      });
    },
    [users, busyUserIds, roleNameToId, withUserUpdate]
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

  const isUserBusy = useCallback(
    (userId) => Boolean(busyUserIds[userId]),
    [busyUserIds]
  );

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