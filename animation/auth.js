// Authentication Guard - Protect main.html from unauthorized access
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_CONFIG } from "../config/credentials.js";

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Check authentication status on page load
window.addEventListener("DOMContentLoaded", async () => {
    // Add a small delay to allow Supabase to initialize session from storage
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    // If no valid session, redirect to login
    if (!session || error) {
        console.log("No valid session found. Redirecting to login...");
        
        // Clear any stale localStorage data
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        localStorage.removeItem("userFullName");
        localStorage.removeItem("userOfficeUnit");
        localStorage.removeItem("isLoggedIn");
        
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
});

// Listen for auth state changes (logout, token expiration, etc.)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out. Redirecting to login...");
        
        // Clear localStorage
        localStorage.clear();
        
        // Redirect to login
        window.location.href = "Log In.html";
    }
});
