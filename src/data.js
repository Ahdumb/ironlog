import { supabase } from "./supabase";

function assertOk(error, fallback) {
  if (error) {
    if (import.meta.env.DEV) console.error("[db]", error);
    throw new Error(fallback);
  }
}

function normalizeDate(date) {
  return typeof date === "number" ? date : new Date(date).getTime();
}

export async function fetchWorkouts(userId) {
  const { data: workoutRows, error: workoutError } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  assertOk(workoutError, "Could not load workouts");
  if (!workoutRows?.length) return [];

  const workoutIds = workoutRows.map(w => w.id);
  const { data: exRows, error: exerciseError } = await supabase
    .from("workout_exercises")
    .select("*")
    .in("workout_id", workoutIds)
    .order("position");
  assertOk(exerciseError, "Could not load workout exercises");

  if (!exRows?.length) {
    return workoutRows.map(w => ({
      id: w.id,
      date: normalizeDate(w.date),
      type: w.type,
      notes: w.notes || "",
      exercises: [],
    }));
  }

  const { data: setRows, error: setError } = await supabase
    .from("exercise_sets")
    .select("*")
    .in("workout_exercise_id", exRows.map(e => e.id))
    .order("position");
  assertOk(setError, "Could not load exercise sets");

  const setsMap = {};
  for (const s of setRows || []) {
    setsMap[s.workout_exercise_id] ||= [];
    setsMap[s.workout_exercise_id].push({
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe || "",
      note: s.note || "",
    });
  }

  const exMap = {};
  for (const ex of exRows) {
    exMap[ex.workout_id] ||= [];
    exMap[ex.workout_id].push({ id: ex.exercise_id, sets: setsMap[ex.id] || [] });
  }

  return workoutRows.map(w => ({
    id: w.id,
    date: normalizeDate(w.date),
    type: w.type,
    notes: w.notes || "",
    exercises: exMap[w.id] || [],
  }));
}

export async function saveWorkoutToDb(userId, workout) {
  let savedWorkout = null;

  try {
    const { data: w, error: workoutError } = await supabase
      .from("workouts")
      .insert({ user_id: userId, date: workout.date, type: workout.type, notes: workout.notes })
      .select()
      .single();
    assertOk(workoutError, "Could not save workout");
    savedWorkout = w;

    for (const [i, ex] of workout.exercises.entries()) {
      const { data: we, error: exerciseError } = await supabase
        .from("workout_exercises")
        .insert({ workout_id: w.id, exercise_id: ex.id, position: i })
        .select()
        .single();
      assertOk(exerciseError, "Could not save workout exercise");

      if (!ex.sets.length) continue;

      const setRows = ex.sets.map((s, j) => ({
        workout_exercise_id: we.id,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe || "",
        note: s.note || "",
        position: j,
      }));

      const { error: setError } = await supabase.from("exercise_sets").insert(setRows);
      assertOk(setError, "Could not save exercise sets");
    }

    return w.id;
  } catch (error) {
    if (savedWorkout?.id) {
      await supabase.from("workouts").delete().eq("id", savedWorkout.id);
    }
    throw error;
  }
}

export async function deleteWorkoutFromDb(workoutId) {
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
  assertOk(error, "Could not delete workout");
  return true;
}

export async function fetchBodyWeight(userId) {
  const { data, error } = await supabase
    .from("body_weight")
    .select("*")
    .eq("user_id", userId)
    .order("date");
  assertOk(error, "Could not load body weight");

  return (data || []).map(r => ({ id: r.id, date: normalizeDate(r.date), weight: r.weight }));
}

export async function saveBodyWeight(userId, date, weight) {
  const { data: existing, error: findError } = await supabase
    .from("body_weight")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .limit(1);
  assertOk(findError, "Could not check existing body weight");

  if (existing?.[0]) {
    const { data, error } = await supabase
      .from("body_weight")
      .update({ weight })
      .eq("id", existing[0].id)
      .select()
      .single();
    assertOk(error, "Could not update body weight");
    return data;
  }

  const { data, error } = await supabase
    .from("body_weight")
    .insert({ user_id: userId, date, weight })
    .select()
    .single();
  assertOk(error, "Could not save body weight");
  return data;
}

export async function deleteBodyWeight(id) {
  const { error } = await supabase.from("body_weight").delete().eq("id", id);
  assertOk(error, "Could not delete body weight");
}

export async function fetchCustomExercises(userId) {
  const { data, error } = await supabase
    .from("custom_exercises")
    .select("*")
    .eq("user_id", userId);
  assertOk(error, "Could not load custom exercises");

  return (data || []).map(r => ({
    id: "c_" + r.id,
    dbId: r.id,
    name: r.name,
    muscle: r.muscle || "",
    type: r.type || "push",
    custom: true,
  }));
}

export async function saveCustomExercise(userId, ex) {
  const { data, error } = await supabase
    .from("custom_exercises")
    .insert({ user_id: userId, name: ex.name, muscle: ex.muscle, type: ex.type })
    .select()
    .single();
  assertOk(error, "Could not save custom exercise");
  return data;
}

// ── SOCIAL ──────────────────────────────────────────────────

export async function syncUserProfile(userId, data) {
  const { error } = await supabase.from("user_profiles").upsert({
    user_id: userId,
    profile_name: data.profile_name || "",
    email: data.email || null,
    weight_lbs: data.weight_lbs || null,
    height_in: data.height_in || null,
    split_id: data.split_id || null,
    updated_at: new Date().toISOString(),
  });
  assertOk(error, "Could not sync profile");
}

export async function searchUsers(query, currentUserId) {
  const q = query.trim();
  if (!q) return [];
  const [byName, byEmail] = await Promise.all([
    supabase.from("user_profiles").select("user_id,profile_name,weight_lbs,height_in,split_id").ilike("profile_name", `%${q}%`).neq("user_id", currentUserId).limit(10),
    supabase.from("user_profiles").select("user_id,profile_name,weight_lbs,height_in,split_id").eq("email", q).neq("user_id", currentUserId).limit(1),
  ]);
  if (byName.error) throw new Error("Search failed");
  const merged = [...(byName.data || [])];
  for (const r of byEmail.data || []) {
    if (!merged.find(u => u.user_id === r.user_id)) merged.push(r);
  }
  return merged;
}

export async function fetchUserProfileById(userId) {
  const { data } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single();
  return data || null;
}

export async function fetchUserProfiles(userIds) {
  if (!userIds.length) return [];
  const { data, error } = await supabase.from("user_profiles").select("*").in("user_id", userIds);
  assertOk(error, "Could not load profiles");
  return data || [];
}

export async function fetchFriendships(userId) {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  assertOk(error, "Could not load friendships");
  return data || [];
}

export async function sendFriendRequest(requesterId, addresseeId) {
  const { error } = await supabase.from("friendships").insert({ requester_id: requesterId, addressee_id: addresseeId });
  assertOk(error, "Could not send friend request");
}

export async function acceptFriendRequest(friendshipId) {
  const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
  assertOk(error, "Could not accept friend request");
}

export async function deleteFriendship(friendshipId) {
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
  assertOk(error, "Could not remove");
}
