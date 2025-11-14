import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { loginUser, forgotPassword } from "../../services/api";
import { useAuth } from "../context/AuthContext";

// ⬇️ *** THIS IS THE FIX (Part 1) *** ⬇️
// Helper function to get the display name for the role
function getRoleDisplayName(roleName) {
  if (roleName === 'admin') {
    return 'administrator';
  }
  if (roleName === 'researcher') {
    return 'Plant Researcher';
  }
  // Default for 'public' or any other role
  return 'user'; 
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  // (All your state variables are unchanged)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mfaCode, setMfaCode] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const generateMockCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // (handleCredentialsSubmit is unchanged)
  const handleCredentialsSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const code = generateMockCode();
      setMockCode(code);
      setUserEmail(email);
      console.log(`MOCK EMAIL: Your verification code is ${code}`);
      setStep(2);
    } catch (err) {
      Alert.alert("Login Failed", err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA verification
  const handleMFASubmit = async () => {
    if (mfaCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      if (mfaCode === mockCode) {
        const response = await loginUser(email, password);
        
        console.log("[LoginScreen] User object received from backend:", JSON.stringify(response.user, null, 2));

        if (response.success && response.user) {
          
          // This call is now correct
          await login(
            response.user, 
            null, 
            rememberMe 
          );
          
          // ⬇️ *** THIS IS THE FIX (Part 2) *** ⬇️
          // We use our new helper function to get the correct name
          const roleDisplayName = getRoleDisplayName(response.user.role_name);
          
          Alert.alert(
            "Login Successful",
            `Signed in as ${roleDisplayName}.`
          );

        } else {
          throw new Error(response.message || 'Login failed after MFA verification');
        }
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err) {
      Alert.alert("Verification Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Other helper functions (unchanged) ---
  const handleResendCode = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newCode = generateMockCode();
      setMockCode(newCode);
      console.log(`MOCK EMAIL: Your new verification code is ${newCode}`);
      Alert.alert("Code Sent", "New verification code sent! Check console for development mode.");
    } catch (err) {
      Alert.alert("Error", "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email) => {
    if (!email) return "";
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const maskedLocal = local.slice(0, 2) + '*'.repeat(local.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  const handleBackToLogin = () => {
    setStep(1);
    setMfaCode("");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Missing Email", "Please enter your registered email first.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert("Check Your Inbox", "Password reset link sent!");
      console.log("Password reset requested for:", email);
    } catch (error) {
      Alert.alert("Error", "Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  // --- JSX Render (unchanged) ---
  return (
    <ImageBackground
      source={require("../../assets/signup-bg.jpg")} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Image
          source={require("../../assets/logo.jpg")} 
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Join us today and explore our amazing features!
        </Text>

        {/* Buttons to switch between Sign Up / Login */}
        <View style={styles.switchButtons}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.switchText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.switchButton, styles.activeButton]}>
            <Text style={[styles.switchText, styles.activeText]}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Step 1 - Credentials Form */}
        {step === 1 && (
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#ccc"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#ccc"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.rowContainer}>
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
              <Ionicons
                name={rememberMe ? "checkbox" : "square-outline"}
                size={22}
                color={rememberMe ? "#4CAF50" : "#ccc"}
              />
              <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleCredentialsSubmit}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Loading..." : "Login"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Step 2 - MFA Verification */}
        {step === 2 && (
          <View style={styles.formContainer}>
            <View style={styles.mfaHeader}>
              <View style={styles.mfaIconContainer}>
                <Ionicons name="mail" size={40} color="#fff" />
              </View>
              <Text style={styles.mfaTitle}>Email Verification</Text>
              <Text style={styles.mfaSubtitle}>
                We sent a 6-digit code to{"\n"}
                <Text style={styles.emailHighlight}>{maskEmail(userEmail)}</Text>
              </Text>
              <Text style={styles.mfaHint}>
                Check your email and enter the code below
              </Text>
              
              {/* Mock code display */}
              <View style={styles.mockCodeDisplay}>
                <Text style={styles.mockTitle}>DEVELOPMENT MODE</Text>
                <Text style={styles.mockCodeText}>
                  Your verification code is: <Text style={styles.codeHighlight}>{mockCode}</Text>
                </Text>
                <Text style={styles.mockNote}>(In production, this would be sent to your email)</Text>
              </View>
            </View>

            {/* MFA Code Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>6-Digit Code</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="123456"
                placeholderTextColor="#ccc"
                value={mfaCode}
                onChangeText={(text) => setMfaCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />
            </View>

            {/* MFA Action Buttons */}
            <View style={styles.mfaButtonGroup}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackToLogin}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.verifyButton,
                  (loading || mfaCode.length !== 6) && styles.buttonDisabled
                ]}
                onPress={handleMFASubmit}
                disabled={loading || mfaCode.length !== 6}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? "Verifying..." : "Verify Code"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Resend Code Option */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity 
                onPress={handleResendCode}
                disabled={loading}
              >
                <Text style={styles.resendButton}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
    </ImageBackground>
  );
}

// (Styles are unchanged)
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#ddd",
    marginBottom: 20,
    textAlign: "center",
  },
  switchButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
  },
  switchButton: {
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
    marginHorizontal: 8,
  },
  switchText: {
    color: "#fff",
    fontWeight: "bold",
  },
  activeButton: {
    backgroundColor: "#78a756ff",
    borderColor: "#78a756ff",
  },
  activeText: {
    color: "#fff",
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "#fff",
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  codeInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    position: "absolute",
    right: 10,
    padding: 8,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  forgotText: {
    color: "#78a756ff",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#78a756ff",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mfaHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  mfaIconContainer: {
    backgroundColor: "rgba(120, 167, 86, 0.8)",
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  mfaTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  mfaSubtitle: {
    fontSize: 14,
    color: "#ddd",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 5,
  },
  emailHighlight: {
    fontWeight: "bold",
    color: "#78a756ff",
  },
  mfaHint: {
    fontSize: 13,
    color: "#bbb",
    textAlign: "center",
    marginBottom: 20,
  },
  mockCodeDisplay: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
  },
  mockTitle: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    fontSize: 14,
  },
  mockCodeText: {
    color: "#ddd",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 5,
  },
  codeHighlight: {
    backgroundColor: "#1F2937",
    color: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "bold",
  },
  mockNote: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  mfaButtonGroup: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  verifyButton: {
    flex: 2,
    paddingVertical: 15,
    backgroundColor: "#78a756ff",
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "rgba(120, 167, 86, 0.5)",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendContainer: {
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  resendText: {
    color: "#ddd",
    fontSize: 13,
    marginBottom: 8,
  },
  resendButton: {
    color: "#78a756ff",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});