import { useState, useEffect } from "react";
import { Works, uploadToStorage } from "../../lib/api";

// ─── DIETARY SUB-TAGS ─────────────────────────────────────────────────────────
const DIET_TAGS = [
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free",  label: "Dairy-Free"  },
  { id: "egg-free",    label: "Egg-Free"    },
  { id: "nut-free",    label: "Nut-Free"    },
  { id: "soy-free",    label: "Soy-Free"    },
  { id: "vegan",       label: "Vegan"       },
];

const UNITS = ["", "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "fl oz", "oz", "lb", "pinch"];

// Lightweight default icon set keyed by common ingredient words. Authors can
// override with a custom uploaded image per ingredient at any time.
const ICON_MAP = [
  [["flour", "cornstarch", "starch"], "🌾"],
  [["chili", "pepper", "paprika", "spice", "powder", "cumin", "cayenne"], "🌶️"],
  [["salt"], "🧂"],
  [["garlic"], "🧄"],
  [["onion"], "🧅"],
  [["chicken", "wing", "drumette", "poultry"], "🍗"],
  [["beef", "steak"], "🥩"],
  [["egg"], "🥚"],
  [["milk", "cream", "dairy"], "🥛"],
  [["cheese"], "🧀"],
  [["butter"], "🧈"],
  [["honey"], "🍯"],
  [["sauce", "bbq", "ketchup"], "🍶"],
  [["oil"], "🫗"],
  [["lemon", "lime", "citrus"], "🍋"],
  [["tomato"], "🍅"],
  [["herb", "basil", "parsley", "cilantro", "thyme", "rosemary"], "🌿"],
  [["rice"], "🍚"],
  [["pasta", "noodle", "macaroni", "mac"], "🍝"],
  [["bread", "bun"], "🍞"],
  [["sugar"], "🧁"],
  [["water"], "💧"],
  [["wine", "beer", "alcohol"], "🍷"],
  [["nut", "almond", "peanut", "walnut", "cashew"], "🥜"],
];

function guessIcon(name) {
  const n = (name || "").toLowerCase();
  for (const [keywords, icon] of ICON_MAP) {
    if (keywords.some(k => n.includes(k))) return icon;
  }
  return "🥄";
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
// Single-line layout: tiny icon, amount, unit, name, diet-warning toggle, delete.
// Diet pills only expand when the warning toggle is clicked, keeping the
// default state compact so a long ingredient list doesn't take forever to fill in.
function CompactIngredientRow({ ing, session, workId, onUpdate, onRemove, onToggleExclude }) {
  const [dietsOpen, setDietsOpen] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const brokenCount = (ing.excludes || []).length;

  return (
    <div style={{ border: "var(--border-thin)", borderRadius: 6, marginBottom: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px" }}>
        <ImageUploadSlot
          url={ing.icon} session={session} workId={workId} pathPrefix="recipe/ingredients" label="icon"
          size={34} uploading={iconUploading} setUploading={setIconUploading}
          onUpload={url => onUpdate({ icon: url })} onRemove={() => onUpdate({ icon: null })}
        />
        <input className="input" type="text" placeholder="Amt" value={ing.amount}
          onChange={e => onUpdate({ amount: e.target.value })}
          style={{ width: 56, padding: "7px 8px", fontSize: 13, flexShrink: 0 }} />
        <select className="input" value={ing.unit} onChange={e => onUpdate({ unit: e.target.value })}
          style={{ width: 78, padding: "7px 6px", fontSize: 13, flexShrink: 0 }}>
          {UNITS.map(u => <option key={u} value={u}>{u || "—"}</option>)}
        </select>
        <input className="input" type="text" placeholder="Ingredient name" value={ing.name}
          onChange={e => onUpdate({ name: e.target.value })}
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
export function RecipeSection({ work, canEdit, session }) {
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

  const addIngredient = () => {
    setIngredients([...ingredients, { id: uid(), amount: "", unit: "", name: "", excludes: [], icon: null }]);
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

  const addStep = () => setSteps([...steps, { id: uid(), title: "", content: "", image: null, ingredientIds: [], tools: [] }]);
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
  const addTool = (stepId, toolName) => {
    if (!toolName.trim()) return;
    setSteps(steps.map(s => s.id === stepId ? { ...s, tools: [...(s.tools || []), toolName.trim()] } : s));
  };
  const removeTool = (stepId, idx) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, tools: (s.tools || []).filter((_, i) => i !== idx) } : s));
  };

  return (
    <div style={{ border: "var(--border-thin)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", background: "var(--black)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--white)", letterSpacing: "0.4px" }}>Editing Recipe</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {savedAt && !saving && <span style={{ fontSize: 11, color: "#9ef01a" }}>✓ Saved</span>}
          <button className="btn btn-sm" onClick={save} disabled={saving}>{saving ? <><span className="spinner" /> Saving…</> : "Save"}</button>
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
          {ingredients.map(ing => (
            <CompactIngredientRow
              key={ing.id}
              ing={ing}
              session={session}
              workId={work.id}
              onUpdate={patch => updateIngredient(ing.id, patch)}
              onRemove={() => removeIngredient(ing.id)}
              onToggleExclude={dietId => toggleExclude(ing.id, dietId)}
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
              onAddTool={name => addTool(s.id, name)}
              onRemoveTool={idx => removeTool(s.id, idx)}
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

function StepEditor({ step, index, total, ingredients, session, workId, onUpdate, onRemove, onMove, onToggleIngredient, onAddTool, onRemoveTool }) {
  const [toolInput, setToolInput] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [ingPickerOpen, setIngPickerOpen] = useState(false);
  const [toolInputOpen, setToolInputOpen] = useState(false);
  const linkedIds = step.ingredientIds || [];
  const linkedIngredients = ingredients.filter(i => linkedIds.includes(i.id));
  const availableIngredients = ingredients.filter(i => i.name.trim() && !linkedIds.includes(i.id));

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
            <input className="input" type="text" placeholder="Step title (e.g. Make the dry rub)" value={step.title}
              onChange={e => onUpdate({ title: e.target.value })} style={{ flex: 1 }} />
            <button className="btn btn-sm" onClick={() => onMove(-1)} disabled={index === 0}>↑</button>
            <button className="btn btn-sm" onClick={() => onMove(1)} disabled={index === total - 1}>↓</button>
            <button className="btn btn-sm" onClick={onRemove} style={{ background: "var(--red)", color: "#fff", borderColor: "var(--black)" }}>×</button>
          </div>
          <textarea className="input" placeholder="Step instructions…" value={step.content}
            onChange={e => onUpdate({ content: e.target.value })} style={{ minHeight: 56 }} />
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
              {ing.icon ? <img src={ing.icon} alt="" style={{ width: 14, height: 14, borderRadius: 2, objectFit: "cover" }} /> : <span>{guessIcon(ing.name)}</span>}
              {ing.name}
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
                <span>{ing.icon ? "" : guessIcon(ing.name)}</span>{ing.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tools / devices — compact add-picker */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--gray-100)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)" }}>Devices &amp; Tools</span>
          <button onClick={() => setToolInputOpen(o => !o)} style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>
            + Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {(step.tools || []).length === 0 && !toolInputOpen && (
            <span style={{ fontSize: 12, color: "var(--gray-400)" }}>None added yet</span>
          )}
          {(step.tools || []).map((t, i) => (
            <span key={i} className="tag-chip" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              🔧 {t}
              <button onClick={() => onRemoveTool(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 12, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        {toolInputOpen && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input className="input" type="text" placeholder="e.g. air fryer, mixing bowl…" value={toolInput} autoFocus
              onChange={e => setToolInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { onAddTool(toolInput); setToolInput(""); } }}
              style={{ maxWidth: 220, padding: "6px 10px", fontSize: 12 }} />
            <button className="btn btn-sm" onClick={() => { onAddTool(toolInput); setToolInput(""); }}>Add</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VIEWER ───────────────────────────────────────────────────────────────────
export function RecipeViewer({ recipe, canEdit, onEdit }) {
  const [servings, setServings] = useState(recipe.baseServings || 4);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [checked, setChecked]   = useState({});

  useEffect(() => { setServings(recipe.baseServings || 4); }, [recipe.baseServings]);

  const mult = servings / (recipe.baseServings || 1);

  const fmtAmount = (raw) => {
    const n = parseFloat(raw);
    if (isNaN(n)) return raw;
    const v = n * mult;
    if (v === Math.floor(v)) return String(v);
    const whole = Math.floor(v);
    const frac = v - whole;
    const fracs = [[0.25, "¼"], [0.33, "⅓"], [0.5, "½"], [0.67, "⅔"], [0.75, "¾"]];
    for (const [f, sym] of fracs) if (Math.abs(frac - f) < 0.06) return (whole > 0 ? whole + " " : "") + sym;
    return v.toFixed(1);
  };

  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const ingredientById = Object.fromEntries(ingredients.map(i => [i.id, i]));

  const recipeWideDiets = DIET_TAGS.filter(d => ingredients.length > 0 && ingredients.every(ing => !(ing.excludes || []).includes(d.id)));

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

      {recipeWideDiets.length > 0 && (
        <div style={{ padding: "10px 18px", borderBottom: "var(--border-thin)", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {recipeWideDiets.map(d => (
            <span key={d.id} className="tag-chip" style={{ background: "#eaf3de", borderColor: "#639922", color: "#3b6d11" }}>{d.label}</span>
          ))}
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
              const compatible = ingredientDiets(ing);
              const conflict = [...activeFilters].some(f => !compatible.some(d => d.id === f));
              const isChecked = !!checked[ing.id];
              return (
                <div key={ing.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: "0.5px solid var(--gray-200)" }}>
                  <div
                    onClick={() => setChecked(c => ({ ...c, [ing.id]: !c[ing.id] }))}
                    style={{ width: 15, height: 15, border: "1.5px solid var(--black)", borderRadius: 3, marginTop: 12, cursor: "pointer", flexShrink: 0, background: isChecked ? "var(--black)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {isChecked && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                  </div>
                  {ing.icon ? (
                    <img src={ing.icon} alt="" style={{ width: 38, height: 38, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <span style={{ fontSize: 26, flexShrink: 0, width: 38, textAlign: "center" }}>{guessIcon(ing.name)}</span>
                  )}
                  <div style={{ flex: 1, opacity: isChecked ? 0.4 : 1 }}>
                    <div style={{ fontSize: 13, textDecoration: isChecked ? "line-through" : "none" }}>
                      <strong>{fmtAmount(ing.amount)}{ing.unit ? ` ${ing.unit}` : ""}</strong> {ing.name}
                      {conflict && <span style={{ color: "var(--red)", fontWeight: 700, marginLeft: 4 }}>⚠</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="section-mono" style={{ marginBottom: 10 }}>Filter by Diet</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {DIET_TAGS.map(d => {
                const active = activeFilters.has(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleFilter(d.id)}
                    style={{
                      fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 12,
                      border: "1.5px solid " + (active ? "#639922" : "var(--gray-200)"),
                      background: active ? "#eaf3de" : "#fff",
                      color: active ? "#3b6d11" : "var(--gray-600)",
                      cursor: "pointer",
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main — steps */}
        <div style={{ padding: 22 }}>
          {steps.map((s, i) => {
            const linkedIngredients = (s.ingredientIds || []).map(id => ingredientById[id]).filter(Boolean);
            const tools = s.tools || [];
            return (
              <div key={s.id} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  {s.image && (
                    <img src={s.image} alt="" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 8, border: "var(--border-thin)", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--red)" }}>Step {i + 1}</span>
                      {s.title && <span style={{ fontSize: 13, fontWeight: 700 }}>{s.title}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.65, marginBottom: 8 }}>{s.content}</div>
                    {(linkedIngredients.length > 0 || tools.length > 0) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {linkedIngredients.map(ing => (
                          <span key={ing.id} className="tag-chip" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5 }}>
                            {ing.icon ? <img src={ing.icon} alt="" style={{ width: 18, height: 18, borderRadius: 3, objectFit: "cover" }} /> : <span style={{ fontSize: 13 }}>{guessIcon(ing.name)}</span>}
                            {ing.name}{ing.amount ? ` ${fmtAmount(ing.amount)}${ing.unit ? " " + ing.unit : ""}` : ""}
                          </span>
                        ))}
                        {tools.map((t, ti) => (
                          <span key={ti} className="tag-chip" style={{ fontSize: 10.5, background: "var(--gray-100)" }}>🔧 {t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {i < steps.length - 1 && <div style={{ height: "0.5px", background: "var(--gray-200)", marginTop: 18 }} />}
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