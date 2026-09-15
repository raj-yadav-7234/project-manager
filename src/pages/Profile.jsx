import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/authContent";

const Profile = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await API.get("/users/profile");

      setProfile(response.data.user);
      setName(response.data.user.name);
    } catch (error) {
      console.error(
        "Profile error:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name cannot be empty");
      return;
    }

    try {
      setSavingName(true);

      const response = await API.put("/users/profile", {
        name: name.trim(),
      });

      setProfile(response.data.user);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      alert("Name updated successfully");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      alert("Please fill in both password fields");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);

      await API.put("/users/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");

      alert("Password changed successfully");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading profile...</div>;
  }

  return (
    <div className="page-container profile-page">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your account information and password.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Account Information */}
        <div className="profile-card">
          <div className="profile-avatar">
            {(profile?.name || user?.name || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <h2>{profile?.name || user?.name}</h2>
          <p className="profile-email">
            {profile?.email || user?.email}
          </p>

          <div className="profile-info">
            <div>
              <span>Name</span>
              <strong>{profile?.name}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{profile?.email}</strong>
            </div>

            <div>
              <span>Account created</span>
              <strong>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "—"}
              </strong>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="profile-card">
          <h2>Edit Profile</h2>

          <form onSubmit={handleUpdateName}>
            <label>Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <label>Email</label>

            <input
              type="email"
              value={profile?.email || ""}
              disabled
            />

            <button
              type="submit"
              disabled={savingName}
            >
              {savingName ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="profile-card">
          <h2>Change Password</h2>

          <form onSubmit={handleChangePassword}>
            <label>Current Password</label>

            <input
              type="password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(e.target.value)
              }
              placeholder="Enter current password"
            />

            <label>New Password</label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              placeholder="Minimum 6 characters"
            />

            <button
              type="submit"
              disabled={changingPassword}
            >
              {changingPassword
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;