// js/api.js

const SUPABASE_URL = 'https://dtmrbjdvcruzrlimumjk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_p1YhWHQedByftmIfRfXUzg_Qyx9BJYH';

// Initialize the global Supabase client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to submit a score
async function submitScore(initials, score) {
    const { error } = await window.supabaseClient
        .from('leaderboard')
        .insert([{ player_name: initials.toUpperCase(), score: score }]);

    if (error) console.error("Error saving score:", error);
}

// Helper function to fetch the top 5 scores
async function getTopScores() {
    const { data, error } = await window.supabaseClient
        .from('leaderboard')
        .select('player_name, score')
        .order('score', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching scores:", error);
        return [];
    }
    return data;
}