// Authentication Guard - Protect main.html from unauthorized access
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_CONFIG } from "../config/credentials.js";

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// === SESSION TIMEOUT CONFIG ===
// Set how long a user can be inactive before automatic logout (in ms).
// Example: 30 minutes = 30 * 60 * 1000
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

let inactivityTimer = null;

function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(async () => {
        console.log("Session timed out due to inactivity. Signing out...");
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Error during automatic sign-out:", e);
        } finally {
            localStorage.clear();
            // Optional: show a basic alert; you can replace with SweetAlert if desired
            alert("Your session has expired due to inactivity. Please log in again.");
            window.location.href = "Log In.html";
        }
    }, SESSION_TIMEOUT_MS);
}

function setupInactivityListeners() {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => {
        window.addEventListener(evt, resetInactivityTimer);
    });
    // Start the timer immediately
    resetInactivityTimer();
}

// Check authentication status on page load
window.addEventListener("DOMContentLoaded", async () => {
    // Add a small delay to allow Supabase to initialize session from storage
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    // Also require a tab-specific flag so opening the dashboard URL
    // in a FRESH tab forces the user through the login page again.
    const tabAuthenticated = sessionStorage.getItem("tabAuthenticated") === "true";

    // If no valid session OR this tab has never gone through login, redirect
    if (!session || error || !tabAuthenticated) {
        console.log("No valid auth for this tab. Redirecting to login...");
        
        // Clear any stale localStorage data
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        localStorage.removeItem("userFullName");
        localStorage.removeItem("userOfficeUnit");
        localStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("tabAuthenticated");
        
        // Redirect to login page
        window.location.href = "Log In.html";
        return;
    }

    // Valid session exists - show page content
    document.body.style.display = '';
    
    // Update welcome message
    const user = session.user;
    const welcomeMessageEl = document.getElementById("welcomeMessage");

    if (welcomeMessageEl) {
        const displayName = user.user_metadata?.full_name || user.email;
        welcomeMessageEl.textContent = `Welcome, ${displayName}`;
    }

    console.log("✅ User authenticated:", user.email);

    // Start inactivity-based session timeout
    setupInactivityListeners();
});

// Listen for auth state changes (logout, token expiration, etc.)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out. Redirecting to login...");
        
        // Clear localStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = "Log In.html";
    }
});
