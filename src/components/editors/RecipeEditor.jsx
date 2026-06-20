import { useState, useEffect } from "react";
import { Works, uploadToStorage } from "../../lib/api";

// ─── DIETARY SUB-TAGS ─────────────────────────────────────────────────────────
export const DIET_TAGS = [
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free",  label: "Dairy-Free"  },
  { id: "egg-free",    label: "Egg-Free"    },
  { id: "nut-free",    label: "Nut-Free"    },
  { id: "soy-free",    label: "Soy-Free"    },
  { id: "vegan",       label: "Vegan"       },
];

// ─── DEVICES & TOOLS ──────────────────────────────────────────────────────────
// Curated cooking devices, each with its own setting type — temperature,
// speed, or heat level — so "Air Fryer at 450°F" or "Blender on Medium" can
// be picked precisely instead of typed as loose free text.
const DEVICES = [
  { id: "oven",        label: "Oven",         icon: "🔥", settingType: "temp" },
  { id: "air-fryer",   label: "Air Fryer",    icon: "🌀", settingType: "temp" },
  { id: "stovetop",    label: "Stovetop",     icon: "🍳", settingType: "heat" },
  { id: "slow-cooker", label: "Slow Cooker",  icon: "🍲", settingType: "heat" },
  { id: "instant-pot", label: "Instant Pot",  icon: "♨️", settingType: "heat" },
  { id: "grill",       label: "Grill",        icon: "🔥", settingType: "temp" },
  { id: "blender",     label: "Blender",      icon: "🌪️", settingType: "speed" },
  { id: "mixer",       label: "Mixer",        icon: "🥣", settingType: "speed" },
  { id: "microwave",   label: "Microwave",    icon: "📡", settingType: "temp" },
  { id: "toaster",     label: "Toaster",      icon: "🍞", settingType: "none" },
  { id: "bowl",        label: "Mixing Bowl",  icon: "🥣", settingType: "none" },
  { id: "pan",         label: "Pan / Skillet", icon: "🍳", settingType: "none" },
  { id: "pot",         label: "Pot",          icon: "🥘", settingType: "none" },
  { id: "baking-sheet", label: "Baking Sheet", icon: "🧈", settingType: "none" },
  { id: "knife",       label: "Knife",        icon: "🔪", settingType: "none" },
  { id: "other",       label: "Other",        icon: "🔧", settingType: "none" },
];

const HEAT_LEVELS = ["Low", "Medium", "High"];
const SPEED_LEVELS = ["Low", "Medium", "High"];

const DEVICE_BY_ID = Object.fromEntries(DEVICES.map(d => [d.id, d]));

function formatDeviceEntry(entry) {
  const d = DEVICE_BY_ID[entry.device];
  if (!d) return entry.device || "";
  const icon = d.icon ? `${d.icon} ` : "";
  if (!entry.setting) return `${icon}${d.label}`;
  if (d.settingType === "temp") return `${icon}${d.label} at ${entry.setting}`;
  if (d.settingType === "heat" || d.settingType === "speed") return `${icon}${d.label} on ${entry.setting}`;
  return `${icon}${d.label}`;
}

// Curated ingredient categories, each with keywords used to auto-match an
// ingredient's typed name. No manual picker — the icon is always derived
// automatically from what the author types. Unmatched ingredients show a
// plain black circle.
const INGREDIENT_CATEGORIES = [
  { id: "meat",    icon: "🍗", keywords: ["chicken", "beef", "pork", "turkey", "bacon", "sausage", "wing", "drumette", "steak", "lamb", "ham", "ground meat", "poultry"] },
  { id: "seafood", icon: "🐟", keywords: ["fish", "salmon", "shrimp", "tuna", "crab", "lobster", "scallop", "cod", "tilapia", "seafood"] },
  { id: "dairy",   icon: "🥛", keywords: ["egg", "milk", "cream", "cheese", "butter", "yogurt", "dairy"] },
  { id: "produce", icon: "🥦", keywords: ["onion", "garlic", "tomato", "lettuce", "carrot", "potato", "pepper bell", "broccoli", "spinach", "lemon", "lime", "apple", "banana", "berry", "vegetable", "fruit", "mushroom", "celery", "cucumber"] },
  { id: "grain",   icon: "🌾", keywords: ["flour", "cornstarch", "starch", "rice", "pasta", "noodle", "macaroni", "bread", "bun", "oat", "tortilla", "grain"] },
  { id: "spice",   icon: "🌶️", keywords: ["chili", "paprika", "cumin", "cayenne", "spice", "powder", "pepper black", "black pepper", "herb", "basil", "parsley", "cilantro", "thyme", "rosemary", "oregano", "salt"] },
  { id: "sauce",   icon: "🍶", keywords: ["sauce", "bbq", "ketchup", "mustard", "mayo", "salsa", "dressing", "vinegar", "soy sauce"] },
  { id: "oil",     icon: "🫗", keywords: ["oil", "fat", "lard", "shortening"] },
  { id: "sugar",   icon: "🍯", keywords: ["sugar", "honey", "syrup", "molasses", "sweetener"] },
  { id: "baking",  icon: "🧁", keywords: ["baking powder", "baking soda", "yeast", "vanilla", "chocolate", "cocoa"] },
  { id: "liquid",  icon: "💧", keywords: ["water", "broth", "stock", "juice"] },
  { id: "nut",     icon: "🥜", keywords: ["nut", "almond", "peanut", "walnut", "cashew", "pecan", "seed"] },
  { id: "alcohol", icon: "🍷", keywords: ["wine", "beer", "rum", "vodka", "whiskey", "alcohol", "liquor"] },
];

// Specific, well-known ingredients get their own exact icon rather than the
// broader category icon (e.g. "banana" shows 🍌, not the produce category's
// generic 🥦). Checked first; falls back to category-level matching below.
const SPECIFIC_ICONS = [
  [["banana"], "🍌"],
  [["apple"], "🍎"],
  [["lemon"], "🍋"],
  [["lime"], "🍋"],
  [["tomato"], "🍅"],
  [["onion"], "🧅"],
  [["garlic"], "🧄"],
  [["carrot"], "🥕"],
  [["potato"], "🥔"],
  [["mushroom"], "🍄"],
  [["pepper bell", "bell pepper"], "🫑"],
  [["broccoli"], "🥦"],
  [["cucumber"], "🥒"],
  [["egg"], "🥚"],
  [["butter"], "🧈"],
  [["cheese"], "🧀"],
  [["milk"], "🥛"],
  [["bacon"], "🥓"],
  [["chicken", "wing", "drumette", "poultry"], "🍗"],
  [["beef", "steak"], "🥩"],
  [["fish", "salmon", "cod", "tilapia"], "🐟"],
  [["shrimp"], "🦐"],
  [["bread", "bun"], "🍞"],
  [["rice"], "🍚"],
  [["pasta", "noodle", "macaroni"], "🍝"],
  [["honey"], "🍯"],
  [["chocolate", "cocoa"], "🍫"],
  [["wine"], "🍷"],
  [["beer"], "🍺"],
];

// Auto-resolve an ingredient's icon by matching its name — first against
// specific well-known ingredients, then against broader categories.
function guessCategory(name) {
  const n = (name || "").toLowerCase();
  for (const [keywords, icon] of SPECIFIC_ICONS) {
    if (keywords.some(k => n.includes(k))) return { icon };
  }
  for (const cat of INGREDIENT_CATEGORIES) {
    if (cat.keywords.some(k => n.includes(k))) return cat;
  }
  return null;
}

// Renders an ingredient's visual marker: auto-matched category emoji, or a
// plain black circle if the typed name doesn't match any known category.
function IngredientIcon({ name, size = 24 }) {
  const cat = guessCategory(name);
  return (
    <span style={{
      width: size, height: size, flexShrink: 0, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: cat ? "var(--gray-100)" : "var(--black)",
      fontSize: size * 0.55, lineHeight: 1,
    }}>
      {cat ? cat.icon : ""}
    </span>
  );
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function parseRecipe(raw) {
  if (!raw) return emptyRecipe();
  try {
    const p = JSON.parse(raw);
    if (p.recipe) return { ...emptyRecipe(), ...p.recipe };
  } catch {}
  return emptyRecipe();
}

function emptyRecipe() {
  return {
    baseServings: 4,
    heroImage: null,
    ingredients: [],
    steps: [],
    notes: "",
  };
}

function saveRecipe(token, workId, recipe) {
  return Works.update(token, workId, { content: JSON.stringify({ recipe }) });
}

function ingredientDiets(ingredient) {
  const excluded = ingredient.excludes || [];
  return DIET_TAGS.filter(d => !excluded.includes(d.id));
}

// ─── IMAGE UPLOAD HELPER ──────────────────────────────────────────────────────
function ImageUploadSlot({ url, onUpload, onRemove, session, workId, pathPrefix, label, size = 80, uploading, setUploading }) {
  const handleFile = async (file) => {
    if (!file || !session) return;
    setUploading(true);
    const path = `${workId}/${pathPrefix}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { url: newUrl, error } = await uploadToStorage(session.access_token, "work-files", path, file);
    setUploading(false);
    if (!error && newUrl) onUpload(newUrl);
  };

  if (url) {
    return (
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1.5px solid var(--gray-200)" }} />
        <button
          onClick={onRemove}
          style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--red)", color: "#fff", border: "1.5px solid #fff", fontSize: 11, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
        >×</button>
      </div>
    );
  }

  return (
    <label style={{
      width: size, height: size, flexShrink: 0, border: "1.5px dashed var(--gray-200)", borderRadius: 6,
      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--gray-100)",
      fontSize: 10, color: "var(--gray-400)", textAlign: "center", padding: 4,
    }}>
      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
      {uploading ? <span className="spinner" /> : <span>+ Photo</span>}
    </label>
  );
}

// ─── COMPACT INGREDIENT ROW ────────────────────────────────────────────────────
// Single-line layout: tiny icon, one free-text ingredient line, diet-warning
// toggle, delete. Diet pills only expand when the warning toggle is clicked,
// keeping the default state compact so a long ingredient list doesn't take
// forever to fill in.
//
// Ingredients are stored as one free-text `line` (e.g. "2 tbsp avocado oil").
// `quantityOf` best-effort extracts a leading quantity for servings scaling;
// `nameOf` strips that quantity back off for display/matching purposes.
export function rawLine(ing) {
  if (ing.line != null) return ing.line;
  // Backward-compat for recipes saved before this single-field format.
  return [ing.quantity ?? [ing.amount, ing.unit].filter(Boolean).join(" "), ing.name].filter(Boolean).join(" ").trim();
}

const QTY_PATTERN = /^(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:tsp|tbsp|cup|cups|oz|lb|lbs|g|kg|ml|l|pinch|clove|cloves|can|cans|slice|slices)?)\s+(.+)$/i;

function quantityOf(ing) {
  const line = rawLine(ing).trim();
  const m = line.match(QTY_PATTERN);
  return m ? m[1].trim() : "";
}

export function nameOf(ing) {
  const line = rawLine(ing).trim();
  const m = line.match(QTY_PATTERN);
  return m ? m[2].trim() : line;
}

function CompactIngredientRow({ ing, index, total, session, workId, onUpdate, onRemove, onToggleExclude, onMove }) {
  const [dietsOpen, setDietsOpen] = useState(false);
  // A row "locks" into a compact read display once it has any text — this
  // keeps a long ingredient list scannable instead of every row permanently
  // showing an input field. Click the pencil to unlock and edit again.
  const line = rawLine(ing);
  const isFilled = !!line.trim();
  const [unlocked, setUnlocked] = useState(!isFilled);
  const brokenCount = (ing.excludes || []).length;

  if (isFilled && !unlocked) {
    return (
      <div style={{ border: "var(--border-thin)", borderRadius: 6, marginBottom: 6, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
          <IngredientIcon name={nameOf(ing)} size={28} />
          <div style={{ flex: 1, fontSize: 13 }}>
            {line}
          </div>
          {brokenCount > 0 && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--red)", whiteSpace: "nowrap" }}>⚠ {brokenCount}</span>
          )}
          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            <button onClick={() => onMove(-1)} disabled={index === 0} title="Move up" style={{ width: 24, height: 24, borderRadius: 5, border: "1.5px solid var(--gray-200)", background: "#fff", fontSize: 11, cursor: "pointer", opacity: index === 0 ? 0.35 : 1 }}>↑</button>
            <button onClick={() => onMove(1)} disabled={index === total - 1} title="Move down" style={{ width: 24, height: 24, borderRadius: 5, border: "1.5px solid var(--gray-200)", background: "#fff", fontSize: 11, cursor: "pointer", opacity: index === total - 1 ? 0.35 : 1 }}>↓</button>
            <button onClick={() => setUnlocked(true)} title="Edit" style={{ width: 24, height: 24, borderRadius: 5, border: "1.5px solid var(--gray-200)", background: "#fff", fontSize: 12, cursor: "pointer" }}>✏️</button>
            <button onClick={onRemove} title="Remove" style={{ width: 24, height: 24, borderRadius: 5, border: "1.5px solid var(--black)", background: "var(--red)", color: "#fff", fontSize: 12, cursor: "pointer" }}>×</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: "var(--border-thin)", borderRadius: 6, marginBottom: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px" }}>
        <IngredientIcon name={nameOf(ing)} size={34} />
        <input className="input" type="text" placeholder="e.g. 2 tbsp avocado oil" value={line}
          onChange={e => onUpdate({ line: e.target.value })}
          style={{ flex: 1, minWidth: 100, padding: "7px 10px", fontSize: 13 }} />
        <button
          onClick={() => setDietsOpen(o => !o)}
          title="Mark dietary exclusions"
          style={{
            flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "6px 9px", borderRadius: 6,
            border: "1.5px solid " + (brokenCount > 0 ? "var(--red)" : "var(--gray-200)"),
            background: brokenCount > 0 ? "#fcebeb" : "#fff",
            color: brokenCount > 0 ? "var(--red)" : "var(--gray-400)",
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          ⚠ {brokenCount > 0 ? brokenCount : ""}
        </button>
        {isFilled && (
          <button onClick={() => setUnlocked(false)} title="Done" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, border: "1.5px solid var(--black)", background: "var(--black)", color: "#fff", fontSize: 12, cursor: "pointer" }}>✓</button>
        )}
        <button onClick={onRemove} style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, border: "1.5px solid var(--black)", background: "var(--red)", color: "#fff", fontSize: 13, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      {dietsOpen && (
        <div style={{ padding: "8px 10px 10px 50px", borderTop: "1px solid var(--gray-100)", background: "var(--gray-100)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)", marginBottom: 6 }}>
            This ingredient breaks:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {DIET_TAGS.map(d => {
              const broken = (ing.excludes || []).includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => onToggleExclude(d.id)}
                  style={{
                    fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                    border: "1.5px solid " + (broken ? "var(--red)" : "var(--gray-200)"),
                    background: broken ? "#fcebeb" : "#fff",
                    color: broken ? "var(--red)" : "var(--gray-600)",
                    cursor: "pointer", textDecoration: broken ? "line-through" : "none",
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RECIPE SECTION (top-level switch) ────────────────────────────────────────
export function RecipeSection({ work, canEdit, session, onContentChange }) {
  const [recipe, setRecipe]     = useState(() => parseRecipe(work.content));
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [savedAt, setSavedAt]   = useState(null);

  useEffect(() => { setRecipe(parseRecipe(work.content)); }, [work.content]);

  const persist = async (next) => {
    setRecipe(next);
    if (!session) return;
    setSaving(true);
    await saveRecipe(session.access_token, work.id, next);
    setSaving(false);
    setSavedAt(Date.now());
    onContentChange?.(JSON.stringify({ recipe: next }));
  };

  return (
    <div>
      {canEdit && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button
            onClick={() => setEditMode(false)}
            style={{
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
              padding: "8px 18px", borderRadius: "var(--radius)", border: "2px solid var(--black)", cursor: "pointer",
              background: !editMode ? "var(--black)" : "#fff", color: !editMode ? "#fff" : "var(--black)",
            }}
          >
            👁 View
          </button>
          <button
            onClick={() => setEditMode(true)}
            style={{
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
              padding: "8px 18px", borderRadius: "var(--radius)", border: "2px solid var(--black)", cursor: "pointer",
              background: editMode ? "var(--black)" : "#fff", color: editMode ? "#fff" : "var(--black)",
            }}
          >
            ✏️ Edit
          </button>
          {savedAt && !saving && (
            <span style={{ alignSelf: "center", fontSize: 11, color: "#3b6d11", marginLeft: 6 }}>✓ Saved</span>
          )}
        </div>
      )}

      {editMode && canEdit ? (
        <RecipeEditor
          recipe={recipe}
          work={work}
          session={session}
          onSave={persist}
          onDone={() => setEditMode(false)}
          saving={saving}
          savedAt={savedAt}
        />
      ) : (
        <RecipeViewer recipe={recipe} canEdit={canEdit} onEdit={() => setEditMode(true)} />
      )}
    </div>
  );
}

// ─── EDITOR ───────────────────────────────────────────────────────────────────
function RecipeEditor({ recipe, work, session, onSave, onDone, saving, savedAt }) {
  const [baseServings, setBaseServings] = useState(recipe.baseServings || 4);
  const [heroImage, setHeroImage]       = useState(recipe.heroImage || null);
  const [ingredients, setIngredients]   = useState(recipe.ingredients || []);
  const [steps, setSteps]               = useState(recipe.steps || []);
  const [notes, setNotes]               = useState(recipe.notes || "");
  const [heroUploading, setHeroUploading] = useState(false);
  const [stepUploading, setStepUploading] = useState({});

  const save = () => onSave({ baseServings, heroImage, ingredients, steps, notes });

  // Auto-save: any change to recipe content is written to Supabase a moment
  // after the person stops typing/editing, so nothing is lost even if they
  // never click "Save" — fields stay fully editable afterward regardless.
  useEffect(() => {
    const t = setTimeout(() => {
      onSave({ baseServings, heroImage, ingredients, steps, notes });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseServings, heroImage, ingredients, steps, notes]);

  const addIngredient = () => {
    setIngredients([...ingredients, { id: uid(), line: "", excludes: [] }]);
  };
  const updateIngredient = (id, patch) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, ...patch } : i));
  };
  const removeIngredient = (id) => {
    setIngredients(ingredients.filter(i => i.id !== id));
    setSteps(steps.map(s => ({ ...s, ingredientIds: (s.ingredientIds || []).filter(x => x !== id) })));
  };
  const toggleExclude = (id, dietId) => {
    setIngredients(ingredients.map(i => {
      if (i.id !== id) return i;
      const excludes = i.excludes || [];
      const next = excludes.includes(dietId) ? excludes.filter(d => d !== dietId) : [...excludes, dietId];
      return { ...i, excludes: next };
    }));
  };
  const moveIngredient = (idx, dir) => {
    const next = [...ingredients];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setIngredients(next);
  };

  const addStep = () => setSteps([...steps, { id: uid(), content: "", image: null, ingredientIds: [], devices: [] }]);
  const updateStep = (id, patch) => setSteps(steps.map(s => s.id === id ? { ...s, ...patch } : s));
  const removeStep = (id) => setSteps(steps.filter(s => s.id !== id));
  const moveStep = (idx, dir) => {
    const next = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSteps(next);
  };
  const toggleStepIngredient = (stepId, ingId) => {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      const cur = s.ingredientIds || [];
      const next = cur.includes(ingId) ? cur.filter(x => x !== ingId) : [...cur, ingId];
      return { ...s, ingredientIds: next };
    }));
  };
  const addDevice = (stepId, deviceId) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, devices: [...(s.devices || []), { device: deviceId, setting: "" }] } : s));
  };
  const updateDevice = (stepId, idx, setting) => {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      const next = [...(s.devices || [])];
      next[idx] = { ...next[idx], setting };
      return { ...s, devices: next };
    }));
  };
  const removeDevice = (stepId, idx) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, devices: (s.devices || []).filter((_, i) => i !== idx) } : s));
  };

  return (
    <div style={{ border: "var(--border-thin)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", background: "var(--black)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--white)", letterSpacing: "0.4px" }}>Editing Recipe</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>— changes save automatically</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {saving ? (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 5 }}><span className="spinner" /> Saving…</span>
          ) : savedAt ? (
            <span style={{ fontSize: 11, color: "#9ef01a" }}>✓ Saved</span>
          ) : null}
          <button className="btn btn-sm" onClick={() => { save(); onDone(); }} style={{ background: "var(--yellow)", borderColor: "var(--black)" }}>Done Editing</button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Hero image + servings */}
        <div style={{ display: "flex", gap: 20, marginBottom: 8, flexWrap: "wrap" }}>
          <div>
            <label className="label">Recipe Photo <span style={{ color: "var(--gray-400)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
            <ImageUploadSlot
              url={heroImage} session={session} workId={work.id} pathPrefix="recipe/hero" label="Recipe photo"
              size={150} uploading={heroUploading} setUploading={setHeroUploading}
              onUpload={setHeroImage} onRemove={() => setHeroImage(null)}
            />
          </div>
          <div className="field" style={{ maxWidth: 220, marginBottom: 0 }}>
            <label className="label">Base Servings</label>
            <input className="input" type="number" min="1" value={baseServings}
              onChange={e => setBaseServings(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
        </div>

        {/* Ingredients */}
        <div style={{ marginTop: 24 }}>
          <div className="section-mono">Ingredients</div>
          {ingredients.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 12 }}>No ingredients yet — add your first one below.</div>
          )}
          {ingredients.map((ing, idx) => (
            <CompactIngredientRow
              key={ing.id}
              ing={ing}
              index={idx}
              total={ingredients.length}
              session={session}
              workId={work.id}
              onUpdate={patch => updateIngredient(ing.id, patch)}
              onRemove={() => removeIngredient(ing.id)}
              onToggleExclude={dietId => toggleExclude(ing.id, dietId)}
              onMove={dir => moveIngredient(idx, dir)}
            />
          ))}
          <button className="btn btn-sm" onClick={addIngredient}>+ Add Ingredient</button>
        </div>

        {/* Steps */}
        <div style={{ marginTop: 24 }}>
          <div className="section-mono">Steps</div>
          {steps.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 12 }}>No steps yet — add your first one below.</div>
          )}
          {steps.map((s, i) => (
            <StepEditor
              key={s.id}
              step={s}
              index={i}
              total={steps.length}
              ingredients={ingredients}
              session={session}
              workId={work.id}
              onUpdate={patch => updateStep(s.id, patch)}
              onRemove={() => removeStep(s.id)}
              onMove={dir => moveStep(i, dir)}
              onToggleIngredient={ingId => toggleStepIngredient(s.id, ingId)}
              onAddDevice={deviceId => addDevice(s.id, deviceId)}
              onUpdateDevice={(idx, setting) => updateDevice(s.id, idx, setting)}
              onRemoveDevice={idx => removeDevice(s.id, idx)}
            />
          ))}
          <button className="btn btn-sm" onClick={addStep}>+ Add Step</button>
        </div>

        {/* Notes */}
        <div style={{ marginTop: 24 }}>
          <div className="section-mono">Notes (optional)</div>
          <textarea className="input" placeholder="Tips, substitutions, storage instructions…" value={notes}
            onChange={e => setNotes(e.target.value)} style={{ minHeight: 70 }} />
        </div>
      </div>
    </div>
  );
}

function StepEditor({ step, index, total, ingredients, session, workId, onUpdate, onRemove, onMove, onToggleIngredient, onAddDevice, onUpdateDevice, onRemoveDevice }) {
  const [imgUploading, setImgUploading] = useState(false);
  const [ingPickerOpen, setIngPickerOpen] = useState(false);
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const linkedIds = step.ingredientIds || [];
  const linkedIngredients = ingredients.filter(i => linkedIds.includes(i.id));
  const availableIngredients = ingredients.filter(i => rawLine(i).trim() && !linkedIds.includes(i.id));

  const handleDeleteClick = () => {
    if (confirmDelete) { onRemove(); return; }
    setConfirmDelete(true);
    setTimeout(() => setConfirmDelete(false), 3000);
  };

  return (
    <div style={{ border: "var(--border-thin)", borderRadius: 6, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <ImageUploadSlot
          url={step.image} session={session} workId={workId} pathPrefix="recipe/steps" label="Step photo"
          size={84} uploading={imgUploading} setUploading={setImgUploading}
          onUpload={url => onUpdate({ image: url })} onRemove={() => onUpdate({ image: null })}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--red)", minWidth: 28 }}>{index + 1}.</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)" }}>Step {index + 1}</span>
            <button className="btn btn-sm" onClick={() => onMove(-1)} disabled={index === 0}>↑</button>
            <button className="btn btn-sm" onClick={() => onMove(1)} disabled={index === total - 1}>↓</button>
            <button
              onClick={handleDeleteClick}
              onBlur={() => setConfirmDelete(false)}
              className="btn btn-sm"
              style={{ background: "var(--red)", color: "#fff", borderColor: "var(--black)", whiteSpace: "nowrap", minWidth: confirmDelete ? 100 : undefined }}
            >
              {confirmDelete ? "Confirm? ×" : "×"}
            </button>
          </div>
          <textarea className="input" placeholder="Describe this step…" value={step.content}
            onChange={e => onUpdate({ content: e.target.value })} style={{ minHeight: 90, fontSize: 14 }} />
        </div>
      </div>

      {/* Ingredients used — compact add-picker */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--gray-100)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)" }}>Ingredients</span>
          {availableIngredients.length > 0 && (
            <button onClick={() => setIngPickerOpen(o => !o)} style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>
              + Add
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {linkedIngredients.length === 0 && !ingPickerOpen && (
            <span style={{ fontSize: 12, color: "var(--gray-400)" }}>None linked yet</span>
          )}
          {linkedIngredients.map(ing => (
            <span key={ing.id} className="tag-chip" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <IngredientIcon name={nameOf(ing)} size={14} />
              {quantityOf(ing) ? `${quantityOf(ing)} ${nameOf(ing)}` : rawLine(ing)}
              <button onClick={() => onToggleIngredient(ing.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 12, padding: 0, marginLeft: 2 }}>×</button>
            </span>
          ))}
        </div>
        {ingPickerOpen && availableIngredients.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8, padding: 8, background: "var(--gray-100)", borderRadius: 6 }}>
            {availableIngredients.map(ing => (
              <button
                key={ing.id}
                onClick={() => { onToggleIngredient(ing.id); }}
                style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 12, border: "1.5px solid var(--gray-200)", background: "#fff", color: "var(--gray-600)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <IngredientIcon name={nameOf(ing)} size={14} />{nameOf(ing)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Devices & tools — curated picker with structured settings per device */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--gray-100)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)" }}>Devices &amp; Tools</span>
          <button onClick={() => setDevicePickerOpen(o => !o)} style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>
            + Add
          </button>
        </div>

        {(step.devices || []).length === 0 && !devicePickerOpen && (
          <span style={{ fontSize: 12, color: "var(--gray-400)" }}>None added yet</span>
        )}

        {(step.devices || []).map((entry, i) => {
          const d = DEVICE_BY_ID[entry.device];
          if (!d) return null;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "6px 10px", background: "var(--gray-100)", borderRadius: 6 }}>
              <span style={{ fontSize: 14 }}>{d.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 90 }}>{d.label}</span>
              {d.settingType === "temp" && (
                <input className="input" type="text" placeholder="e.g. 450°F" value={entry.setting}
                  onChange={e => onUpdateDevice(i, e.target.value)}
                  style={{ width: 110, padding: "5px 8px", fontSize: 12 }} />
              )}
              {(d.settingType === "heat" || d.settingType === "speed") && (
                <div style={{ display: "flex", gap: 4 }}>
                  {(d.settingType === "heat" ? HEAT_LEVELS : SPEED_LEVELS).map(level => (
                    <button
                      key={level}
                      onClick={() => onUpdateDevice(i, level)}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10,
                        border: "1.5px solid " + (entry.setting === level ? "var(--black)" : "var(--gray-200)"),
                        background: entry.setting === level ? "var(--black)" : "#fff",
                        color: entry.setting === level ? "#fff" : "var(--gray-600)",
                        cursor: "pointer",
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => onRemoveDevice(i)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: 14, padding: 0 }}>×</button>
            </div>
          );
        })}

        {devicePickerOpen && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8, padding: 8, background: "var(--gray-100)", borderRadius: 6 }}>
            {DEVICES.map(d => (
              <button
                key={d.id}
                onClick={() => { onAddDevice(d.id); setDevicePickerOpen(false); }}
                style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 12, border: "1.5px solid var(--gray-200)", background: "#fff", color: "var(--gray-600)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <span>{d.icon}</span>{d.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VIEWER ───────────────────────────────────────────────────────────────────
export function RecipeViewer({ recipe, canEdit, onEdit }) {
  const [servings, setServings] = useState(recipe.baseServings || 4);
  const [checked, setChecked]   = useState({});

  useEffect(() => { setServings(recipe.baseServings || 4); }, [recipe.baseServings]);

  const mult = servings / (recipe.baseServings || 1);

  // Scales the leading number in a free-text quantity string (e.g. "2 tbsp" -> "4 tbsp"
  // at 2x servings) and leaves any non-numeric text (units, "to taste", etc.) untouched.
  const fmtQuantity = (raw) => {
    const str = String(raw ?? "").trim();
    if (!str) return str;
    const match = str.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
    if (!match) return str; // no leading number — e.g. "to taste"
    const n = parseFloat(match[1]);
    const rest = match[2];
    const v = n * mult;
    let formatted;
    if (v === Math.floor(v)) {
      formatted = String(v);
    } else {
      const whole = Math.floor(v);
      const frac = v - whole;
      const fracs = [[0.25, "¼"], [0.33, "⅓"], [0.5, "½"], [0.67, "⅔"], [0.75, "¾"]];
      const match2 = fracs.find(([f]) => Math.abs(frac - f) < 0.06);
      formatted = match2 ? (whole > 0 ? whole + " " : "") + match2[1] : v.toFixed(1);
    }
    return formatted + rest;
  };

  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const ingredientById = Object.fromEntries(ingredients.map(i => [i.id, i]));

  if (ingredients.length === 0 && steps.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--gray-400)", marginBottom: 10 }}>No recipe content yet</div>
        {canEdit && <button className="btn btn-primary" onClick={onEdit}>+ Add Ingredients & Steps</button>}
      </div>
    );
  }

  return (
    <div style={{ border: "var(--border-thin)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      {recipe.heroImage && (
        <div style={{ width: "100%", maxHeight: 460, overflow: "hidden", borderBottom: "var(--border-thin)" }}>
          <img src={recipe.heroImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr" }}>
        {/* Sidebar — ingredients + servings + filters */}
        <div style={{ borderRight: "var(--border-thin)", padding: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="section-mono" style={{ marginBottom: 10 }}>Servings</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn btn-sm" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, minWidth: 24, textAlign: "center" }}>{servings}</span>
              <button className="btn btn-sm" onClick={() => setServings(s => s + 1)}>+</button>
              <span style={{ fontSize: 12, color: "var(--gray-400)" }}>servings</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="section-mono" style={{ marginBottom: 10 }}>Ingredients</div>
            {ingredients.map(ing => {
              const isChecked = !!checked[ing.id];
              return (
                <div key={ing.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: "0.5px solid var(--gray-200)" }}>
                  <div
                    onClick={() => setChecked(c => ({ ...c, [ing.id]: !c[ing.id] }))}
                    style={{ width: 15, height: 15, border: "1.5px solid var(--black)", borderRadius: 3, marginTop: 12, cursor: "pointer", flexShrink: 0, background: isChecked ? "var(--black)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {isChecked && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                  </div>
                  <IngredientIcon name={nameOf(ing)} size={38} />
                  <div style={{ flex: 1, opacity: isChecked ? 0.4 : 1 }}>
                    <div style={{ fontSize: 13, textDecoration: isChecked ? "line-through" : "none" }}>
                      {quantityOf(ing) ? <><strong>{fmtQuantity(quantityOf(ing))}</strong> {nameOf(ing)}</> : rawLine(ing)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main — steps */}
        <div style={{ padding: 22 }}>
          {steps.map((s, i) => {
            const linkedIngredients = (s.ingredientIds || []).map(id => ingredientById[id]).filter(Boolean);
            const devices = s.devices || [];
            return (
              <div key={s.id} style={{ marginBottom: 26 }}>
                {s.image && (
                  <img src={s.image} alt="" style={{ display: "block", maxWidth: "100%", width: "auto", height: "auto", maxHeight: 285, borderRadius: 10, marginBottom: 16, marginLeft: "auto", marginRight: "auto" }} />
                )}
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--red)" }}>Step {i + 1}</span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.7, marginBottom: 8 }}>{s.content}</div>
                {(linkedIngredients.length > 0 || devices.length > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {linkedIngredients.map(ing => (
                      <span key={ing.id} className="tag-chip" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5 }}>
                        <IngredientIcon name={nameOf(ing)} size={18} />
                        {quantityOf(ing) ? `${fmtQuantity(quantityOf(ing))} ${nameOf(ing)}` : rawLine(ing)}
                      </span>
                    ))}
                    {devices.map((entry, di) => (
                      <span key={di} className="tag-chip" style={{ fontSize: 10.5, background: "var(--gray-100)" }}>{formatDeviceEntry(entry)}</span>
                    ))}
                  </div>
                )}
                {i < steps.length - 1 && <div style={{ height: "0.5px", background: "var(--gray-200)", marginTop: 20 }} />}
              </div>
            );
          })}

          {recipe.notes && (
            <div style={{ marginTop: 24, padding: 14, background: "var(--gray-100)", borderRadius: 6, borderLeft: "3px solid var(--red)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-600)", marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6 }}>{recipe.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}