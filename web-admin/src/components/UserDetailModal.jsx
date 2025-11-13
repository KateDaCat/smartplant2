import React, { useState, useEffect, useMemo } from "react";

const DEFAULT_ROLE_OPTIONS = ["Admin", "Plant Researcher", "User"];

export default function UserDetailModal({
  user,
  onClose,
  roleOptions = [],
  onChangeRole,
  onChangeActive,
  isBusy = false,
}) {
  const [currentUser, setCurrentUser] = useState(user);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const selectableRoles = useMemo(() => {
    return roleOptions.length ? roleOptions : DEFAULT_ROLE_OPTIONS;
  }, [roleOptions]);

  const formatDate = (iso) => {
    if (!iso || iso === 'N/A') return 'Pending sync';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
  };

  const confirmRoleChange = async (role) => {
    if (role === currentUser.role) {
      setRoleMenuOpen(false);
      return;
    }

    if (!onChangeRole || isBusy) {
      setRoleMenuOpen(false);
      return;
    }

    if (window.confirm(`Assign ${role} role to ${currentUser.username}?`)) {
      const success = await onChangeRole(currentUser.user_id, role);
      if (success) {
        setRoleMenuOpen(false);
      }
    }
  };

  const confirmActiveChange = async (nextValue) => {
    if (nextValue === currentUser.active) return;

    const action = nextValue ? 'activate' : 'deactivate';
    if (!onChangeActive || isBusy) return;

    if (window.confirm(`Are you sure you want to ${action} ${currentUser.username}'s account?`)) {
      await onChangeActive(currentUser.user_id, nextValue);
    }
  };

  const DetailRow = ({ label, value }) => (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value ?? '?'}</span>
    </div>
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.content}>
          {/* Header Card - Matches Mobile Design */}
          <div style={styles.headerCard}>
            <div style={styles.avatarWrapper}>
              <div style={styles.avatar}>
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div style={styles.headerText}>
              <h2 style={styles.title}>{currentUser.username}</h2>
              <p style={styles.subtitle}>User ID: {currentUser.user_id}</p>
              <div
                style={{
                  ...styles.statusBadge,
                  ...(currentUser.active ? styles.statusBadgeActive : styles.statusBadgeInactive),
                }}
              >
                <span style={styles.statusBadgeIcon}>
                  {currentUser.active ? '✓' : '⏸'}
                </span>
                <span
                  style={{
                    ...styles.statusBadgeText,
                    ...(currentUser.active ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive),
                  }}
                >
                  {currentUser.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details Card - Matches Mobile Design */}
          <div style={styles.infoCard}>
            <h3 style={styles.sectionTitle}>Contact Details</h3>
            <DetailRow label="Email" value={currentUser.email} />
            <DetailRow label="Phone" value={currentUser.phone} />
            <DetailRow label="Created" value={formatDate(currentUser.created_at)} />
          </div>

          {/* Account Controls Card - Matches Mobile Design */}
          <div style={styles.controlsCard}>
            <h3 style={styles.sectionTitle}>Account Controls</h3>
            
            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Active Status</span>
              <div style={styles.toggleGroup}>
                <span
                  style={{
                    ...styles.statusText,
                    ...(currentUser.active ? styles.statusActive : styles.statusInactive),
                  }}
                >
                  {currentUser.active ? 'Active' : 'Inactive'}
                </span>
                  {/* Simple toggle switch without complex CSS */}
                  <div
                    style={{
                      ...styles.switch,
                      backgroundColor: currentUser.active ? "#3AA272" : "#D0D7DD",
                      opacity: isBusy ? 0.5 : 1,
                      cursor: isBusy ? "not-allowed" : "pointer",
                    }}
                    onClick={() => {
                      if (isBusy) return;
                      confirmActiveChange(!currentUser.active);
                    }}
                >
                    <div
                    style={{
                      ...styles.slider,
                      left: currentUser.active ? "22px" : "2px",
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Assign Role</span>
              <div style={styles.roleSelectContainer}>
                  <button
                    style={styles.roleSelect}
                    onClick={() => {
                      if (isBusy) return;
                      setRoleMenuOpen((prev) => !prev);
                    }}
                    disabled={isBusy}
                >
                  <span style={styles.roleSelectText}>{currentUser.role}</span>
                  <span style={styles.roleSelectIcon}>
                    {roleMenuOpen ? '▲' : '▼'}
                  </span>
                </button>

                {roleMenuOpen && (
                  <div style={styles.roleDropdown}>
                      {selectableRoles.map((role) => (
                      <button
                        key={role}
                        style={styles.roleOption}
                          onClick={() => {
                            if (isBusy) return;
                            confirmRoleChange(role);
                          }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button style={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: "#F6F9F4",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  },
  content: {
    padding: "20px",
    gap: "20px",
    display: "flex",
    flexDirection: "column",
  },

  // Header Card - Matches Mobile Design
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
    border: "1px solid #E4E9EE",
  },
  avatarWrapper: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    backgroundColor: "#E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatar: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#64748B",
  },
  headerText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#1F2A37",
  },
  subtitle: {
    fontSize: "13px",
    margin: 0,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "500",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "999px",
    alignSelf: "flex-start",
  },
  statusBadgeActive: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeIcon: {
    fontSize: "14px",
  },
  statusBadgeText: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  statusBadgeTextActive: {
    color: "#166534",
  },
  statusBadgeTextInactive: {
    color: "#7F1D1D",
  },

  // Info Card - Matches Mobile Design
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    fontWeight: 700,
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },

  // Detail Row styles
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
  },
  detailLabel: {
    fontSize: "14px",
    color: "#475569",
  },
  detailValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1F2937",
    textAlign: "right",
  },

  // Controls Card - Matches Mobile Design
  controlsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #DBE2F0",
    boxShadow: "0 2px 7px rgba(0,0,0,0.04)",
  },
  controlRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  controlLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#0F172A",
  },
  toggleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  statusText: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  statusActive: {
    color: "#3AA272",
  },
  statusInactive: {
    color: "#B03A2E",
  },

  // Switch styles - Simplified
  switch: {
    position: "relative",
    width: "44px",
    height: "22px",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "0.2s",
  },
  slider: {
    position: "absolute",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "white",
    top: "2px",
    transition: "0.2s",
  },

  divider: {
    height: "1px",
    backgroundColor: "#E2E8F0",
    margin: "12px 0",
  },

  // Role Select styles
  roleSelectContainer: {
    position: "relative",
  },
  roleSelect: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "12px",
    backgroundColor: "#EEF2F7",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
  },
  roleSelectText: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1F2937",
  },
  roleSelectIcon: {
    fontSize: "12px",
    color: "#1F2A37",
  },
  roleDropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "4px",
    borderRadius: "12px",
    border: "1px solid #D4DBE3",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    zIndex: 10,
    minWidth: "160px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  roleOption: {
    padding: "10px 16px",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    color: "#1F2937",
    width: "100%",
    textAlign: "left",
  },
  "roleOption:hover": {
    backgroundColor: "#F8FAFC",
  },

  closeBtn: {
    margin: "20px",
    padding: "12px",
    background: "#1E88E5",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    width: "calc(100% - 40px)",
  },
};