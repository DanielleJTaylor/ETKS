export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      :root {
        --white:#ffffff; --off-white:#fafafa; --black:#111111;
        --red:#ed1c24; --red-dark:#c4151c;
        --yellow:#ffde17;
        --gray-100:#f4f4f4; --gray-200:#e5e5e5; --gray-400:#999999; --gray-600:#555555;
        --border:3px solid #111111; --border-thin:2px solid #111111;
        --radius:8px; --radius-pill:14px;
        --font-serif:'Bangers',cursive;
        --font-sans:'Inter',sans-serif;
        --font-mono:'DM Mono',monospace;
      }
      body { font-family:var(--font-sans); background:var(--off-white); color:var(--black); }

      .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; font-family:var(--font-sans); font-size:12px; font-weight:700; letter-spacing:0.03em; text-transform:uppercase; padding:10px 22px; border:var(--border); border-radius:var(--radius); cursor:pointer; transition:transform 0.1s, box-shadow 0.1s; background:var(--white); color:var(--black); white-space:nowrap; text-decoration:none; }
      .btn:hover { transform:translate(-2px,-2px); box-shadow:3px 3px 0 var(--black); }
      .btn-primary { background:var(--black); color:var(--white); }
      .btn-primary:hover { background:var(--red); border-color:var(--red); box-shadow:3px 3px 0 var(--black); }
      .btn-red { background:var(--red); color:var(--white); border-color:var(--black); }
      .btn-red:hover { background:var(--red-dark); box-shadow:3px 3px 0 var(--black); }
      .btn-ghost { border-color:transparent; }
      .btn-ghost:hover { background:var(--gray-100); color:var(--black); transform:none; box-shadow:none; }
      .btn-sm { padding:6px 14px; font-size:11px; }
      .btn:disabled { opacity:0.45; cursor:not-allowed; pointer-events:none; transform:none; box-shadow:none; }

      .input { width:100%; font-family:var(--font-sans); font-size:14px; padding:10px 14px; border:var(--border-thin); border-radius:6px; background:var(--white); color:var(--black); outline:none; transition:border-color 0.12s; }
      .input:focus { border-color:var(--red); }
      .input::placeholder { color:var(--gray-400); }
      textarea.input { resize:vertical; min-height:90px; }
      select.input { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23111111'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }

      .label { display:block; font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--gray-600); margin-bottom:6px; }
      .field { margin-bottom:18px; }
      .error-msg { font-size:12px; color:var(--red); margin-top:6px; font-weight:500; }

      .tag-suggestions { position:absolute; top:calc(100% + 2px); left:0; right:0; background:var(--white); border:var(--border); z-index:200; max-height:220px; overflow-y:auto; }
      .tag-sugg-item { display:block; width:100%; text-align:left; padding:9px 13px; font-family:var(--font-mono); font-size:12px; background:none; border:none; border-bottom:var(--border-thin); cursor:pointer; color:var(--black); transition:background 0.1s; }
      .tag-sugg-item:last-child { border-bottom:none; }
      .tag-sugg-item:hover,.tag-sugg-item:focus { background:var(--gray-100); outline:none; }

      .overlay { position:fixed; inset:0; background:rgba(17,17,17,0.6); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; animation:fadeIn 0.15s ease; }
      @keyframes fadeIn { from{opacity:0}to{opacity:1} }
      .modal { background:var(--white); border:var(--border); border-radius:var(--radius); width:100%; max-width:440px; animation:slideUp 0.18s ease; max-height:90vh; overflow-y:auto; }
      @keyframes slideUp { from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1} }
      .modal-header { padding:22px 28px 18px; border-bottom:var(--border-thin); display:flex; align-items:flex-start; justify-content:space-between; position:sticky; top:0; background:var(--white); z-index:1; }
      .modal-body { padding:28px; }
      .modal-title { font-family:var(--font-serif); font-size:26px; letter-spacing:0.3px; line-height:1.2; }
      .modal-subtitle { font-size:13px; color:var(--gray-600); margin-top:4px; }
      .close-btn { background:none; border:none; cursor:pointer; font-size:20px; color:var(--gray-400); line-height:1; padding:2px 4px; margin-top:-2px; transition:color 0.12s; }
      .close-btn:hover { color:var(--black); }
      .text-link { font-size:13px; color:var(--red); font-weight:700; cursor:pointer; border:none; background:none; padding:0; }
      .text-link:hover { text-decoration:underline; }
      .auth-footer { text-align:center; margin-top:20px; font-size:13px; color:var(--gray-600); }

      .nav { background:var(--white); border-bottom:var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 28px; height:60px; position:sticky; top:0; z-index:50; }
      .nav-logo { font-family:var(--font-serif); font-size:24px; letter-spacing:0.5px; cursor:pointer; user-select:none; text-decoration:none; color:var(--black); }
      .nav-logo span { color:var(--red); }
      .nav-actions { display:flex; align-items:center; gap:8px; }
      .nav-user { font-size:12px; color:var(--gray-400); margin-right:4px; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

      .page-wrap { max-width:1100px; margin:0 auto; padding:0 24px 80px; }
      .page-header { padding:32px 0 20px; border-bottom:var(--border); margin-bottom:28px; display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:12px; }
      .page-title { font-family:var(--font-serif); font-size:36px; letter-spacing:0.4px; }
      .page-sub { font-size:13px; color:var(--gray-600); margin-top:4px; }

      .back-btn { font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; color:var(--gray-600); background:none; border:none; display:flex; align-items:center; gap:6px; margin-bottom:16px; transition:color 0.12s; padding:0; }
      .back-btn:hover { color:var(--black); }

      .success-banner { background:var(--black); color:var(--white); padding:12px 16px; border-radius:6px; font-size:13px; font-weight:600; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
      .info-banner { background:var(--gray-100); border:var(--border-thin); border-radius:6px; color:var(--gray-600); padding:12px 16px; font-size:13px; margin-bottom:20px; line-height:1.5; }
      .warn-banner { background:#fff8e1; border:2px solid var(--yellow); border-radius:6px; color:#7a5800; padding:12px 16px; font-size:13px; margin-bottom:20px; line-height:1.5; }
      .spinner { display:inline-block; width:13px; height:13px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.7s linear infinite; }
      @keyframes spin { to{transform:rotate(360deg)} }
      .page-loading { display:flex; align-items:center; justify-content:center; padding:80px 0; gap:10px; color:var(--gray-400); font-size:13px; }

      .tag-chip { font-family:var(--font-sans); font-size:11px; font-weight:700; padding:4px 11px; border:var(--border-thin); border-radius:var(--radius-pill); background:var(--white); letter-spacing:0.01em; }
      .format-badge { font-family:var(--font-sans); font-size:10px; font-weight:700; padding:4px 10px; border-radius:var(--radius-pill); border:var(--border-thin); background:var(--yellow); color:var(--black); letter-spacing:0.03em; text-transform:uppercase; white-space:nowrap; }
      .vis-badge { font-size:10px; font-weight:700; padding:4px 10px; border-radius:var(--radius-pill); letter-spacing:0.03em; text-transform:uppercase; border:var(--border-thin); white-space:nowrap; }
      .vis-badge.private { color:var(--gray-600); border-color:var(--gray-400); }
      .vis-badge.public  { color:var(--red); border-color:var(--red); }

      .section-mono { font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.15em; text-transform:uppercase; color:var(--gray-400); padding-bottom:14px; border-bottom:var(--border-thin); margin-bottom:18px; }

      .form-section { margin-bottom:28px; }
      .tags-list { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
      .tag-item { display:flex; align-items:center; gap:5px; font-family:var(--font-mono); font-size:11px; font-weight:500; padding:4px 10px; border:var(--border-thin); background:var(--gray-100); }
      .tag-remove { background:none; border:none; cursor:pointer; color:var(--gray-400); font-size:14px; line-height:1; padding:0; transition:color 0.1s; }
      .tag-remove:hover { color:var(--red); }
      .tags-input-wrap { display:flex; gap:8px; }

      .format-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; margin-top:8px; }
      .format-option { border:var(--border); padding:12px; cursor:pointer; transition:all 0.12s; background:var(--white); text-align:left; }
      .format-option:hover { background:var(--gray-100); }
      .format-option.selected { background:var(--black); color:var(--white); }
      .format-option-name { font-size:13px; font-weight:600; display:block; margin-bottom:2px; }
      .format-option-desc { font-size:11px; opacity:0.6; }

      .vis-toggle { display:flex; margin-top:8px; }
      .vis-option { flex:1; padding:10px; border:var(--border); cursor:pointer; font-size:13px; font-weight:600; text-align:center; transition:all 0.12s; background:var(--white); margin-right:-2px; }
      .vis-option:last-child { margin-right:0; }
      .vis-option:hover { background:var(--gray-100); }
      .vis-option.selected { background:var(--black); color:var(--white); }

      /* Browse */
      .browse-wrap { max-width:1100px; margin:0 auto; padding:0 24px 80px; }
      .search-builder { background:var(--white); border:var(--border); border-radius:var(--radius); margin-bottom:24px; overflow:hidden; }
      .search-builder-header { padding:12px 20px; border-bottom:var(--border-thin); display:flex; align-items:center; justify-content:space-between; background:var(--black); }
      .search-builder-title { font-family:var(--font-serif); font-size:17px; letter-spacing:0.5px; color:var(--white); }
      .filter-row { border-bottom:var(--border-thin); display:flex; align-items:stretch; }
      .filter-row:last-of-type { border-bottom:none; }
      .filter-row-label { display:flex; flex-direction:column; justify-content:center; gap:3px; padding:14px 18px; width:190px; flex-shrink:0; border-right:var(--border-thin); background:var(--gray-100); }
      .filter-row-label-badge { display:inline-flex; align-items:center; font-family:var(--font-serif); font-size:12px; letter-spacing:0.3px; padding:3px 11px; border-radius:var(--radius-pill); width:fit-content; margin-bottom:4px; }
      .filter-row-label-badge.and { background:var(--black); color:var(--white); }
      .filter-row-label-badge.or  { background:var(--red); color:var(--white); }
      .filter-row-label-badge.exclude { background:var(--white); color:var(--gray-600); border:var(--border-thin); }
      .filter-row-label-text { font-size:10.5px; color:var(--gray-400); line-height:1.4; }
      .filter-row-body { flex:1 1 0; min-width:0; padding:10px 14px; display:flex; align-items:center; flex-wrap:wrap; gap:6px; min-height:52px; }
      .filter-tag { display:inline-flex; align-items:center; gap:5px; font-family:var(--font-sans); font-size:11px; font-weight:700; padding:5px 12px; border-radius:var(--radius-pill); border:var(--border-thin); white-space:nowrap; }
      .filter-tag.and { background:var(--black); color:var(--white); border-color:var(--black); }
      .filter-tag.or  { background:var(--red); color:var(--white); border-color:var(--red); }
      .filter-tag.exclude { background:var(--white); color:var(--gray-400); text-decoration:line-through; }
      .filter-tag-remove { background:none; border:none; cursor:pointer; opacity:0.65; font-size:14px; line-height:1; padding:0; color:inherit; }
      .filter-tag-remove:hover { opacity:1; }
      .filter-inline-input { font-family:var(--font-sans); font-size:12px; padding:5px 12px; border:2px dashed var(--gray-400); border-radius:var(--radius-pill); background:var(--white); color:var(--black); outline:none; width:140px; transition:border-color 0.12s; }
      .filter-inline-input:focus { border-color:var(--red); border-style:solid; }
      .filter-inline-input::placeholder { color:var(--gray-400); }
      .search-actions { padding:14px 18px; border-top:var(--border-thin); background:var(--gray-100); display:flex; gap:8px; align-items:center; }
      .sort-select-wrap { display:flex; align-items:center; gap:8px; }
      .sort-label { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:var(--gray-400); white-space:nowrap; }
      .sort-select { font-family:var(--font-sans); font-size:12px; font-weight:700; padding:8px 32px 8px 14px; border:var(--border-thin); border-radius:var(--radius); background:var(--white); color:var(--black); cursor:pointer; outline:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23111111'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; }
      .sort-select:focus { border-color:var(--red); }
      .browse-card { background:var(--white); border:var(--border-thin); border-radius:var(--radius); padding:20px; margin-bottom:12px; transition:transform 0.1s, box-shadow 0.1s; cursor:pointer; }
      .browse-card:hover { transform:translate(-3px,-3px); box-shadow:4px 4px 0 var(--black); }
      .browse-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px; }
      .browse-card-title { font-family:var(--font-serif); font-size:22px; letter-spacing:0.3px; line-height:1.15; }
      .browse-card-desc { font-size:13px; color:var(--gray-600); line-height:1.6; margin-bottom:10px; }
      .browse-card-bottom { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
      .browse-tags { display:flex; flex-wrap:wrap; gap:5px; }
      .browse-reactions { display:flex; align-items:center; gap:6px; }
      .reaction-btn { display:inline-flex; align-items:center; gap:5px; font-family:var(--font-sans); font-size:12px; font-weight:700; padding:5px 12px; border-radius:var(--radius-pill); border:var(--border-thin); background:var(--white); cursor:pointer; transition:all 0.12s; color:var(--black); }
      .reaction-btn:hover { border-color:var(--black); background:var(--gray-100); }
      .reaction-btn.active-like { background:var(--black); color:var(--white); border-color:var(--black); }
      .reaction-btn.active-dislike { background:var(--gray-600); color:var(--white); border-color:var(--gray-600); }
      .reaction-btn:disabled { opacity:0.45; cursor:default; pointer-events:none; }

      /* Dashboard cards */
      .work-card { border-bottom:var(--border-thin); padding:20px 0; display:flex; align-items:flex-start; justify-content:space-between; gap:16px; cursor:pointer; transition:background 0.1s; }
      .work-card:last-child { border-bottom:none; }
      .work-card:hover { background:var(--gray-100); margin:0 -12px; padding:20px 12px; }
      .work-card-left { flex:1; min-width:0; }
      .work-card-title { font-family:var(--font-serif); font-size:17px; font-weight:700; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .work-card-meta { font-size:12px; color:var(--gray-400); margin-bottom:8px; }
      .work-tags { display:flex; flex-wrap:wrap; gap:5px; }
      .work-card-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; padding-top:2px; }
      .card-action-btn { font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; background:none; border:var(--border-thin); padding:3px 8px; color:var(--gray-600); transition:all 0.12s; }
      .card-action-btn:hover { background:var(--black); color:var(--white); border-color:var(--black); }
      .card-action-btn.danger:hover { background:var(--red); color:var(--white); border-color:var(--red); }

      /* Work detail */
      .work-detail-wrap { max-width:1100px; margin:0 auto; padding:0 24px 80px; }
      .work-detail-header { padding:32px 0 24px; border-bottom:var(--border); margin-bottom:28px; }
      .work-detail-title { font-family:var(--font-serif); font-size:clamp(24px,4vw,42px); font-weight:900; line-height:1.1; margin-bottom:12px; }
      .work-detail-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
      .work-detail-desc { font-size:15px; color:var(--gray-600); line-height:1.75; white-space:pre-wrap; }
      .work-detail-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:14px; }
      .work-detail-reactions { display:flex; gap:8px; align-items:center; padding:16px 0; border-top:var(--border-thin); border-bottom:var(--border-thin); margin-bottom:28px; }

      /* Prose editor */
      .prose-editor-shell { border:var(--border); background:var(--white); }
      .prose-toolbar { display:flex; gap:2px; padding:8px 10px; border-bottom:var(--border-thin); background:var(--off-white); flex-wrap:wrap; align-items:center; }
      .pt-btn { font-size:12px; padding:4px 8px; border:var(--border-thin); background:var(--white); cursor:pointer; color:var(--black); transition:all 0.1s; min-width:28px; text-align:center; line-height:1.4; }
      .pt-btn:hover { background:var(--black); color:var(--white); }
      .pt-btn.active { background:var(--black); color:var(--white); }
      .pt-sep { width:1px; height:20px; background:var(--gray-200); margin:0 4px; flex-shrink:0; }
      .pt-select { font-family:var(--font-mono); font-size:11px; padding:4px 8px; border:var(--border-thin); background:var(--white); color:var(--black); cursor:pointer; outline:none; height:28px; }
      .prose-chapters { display:flex; align-items:center; gap:0; border-bottom:var(--border-thin); background:var(--off-white); overflow-x:auto; }
      .prose-ch-tab { font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.06em; padding:8px 14px; border:none; border-right:var(--border-thin); background:transparent; cursor:pointer; white-space:nowrap; color:var(--gray-600); transition:all 0.1s; }
      .prose-ch-tab:hover { background:var(--gray-100); color:var(--black); }
      .prose-ch-tab.active { background:var(--white); color:var(--black); border-bottom:2px solid var(--red); }
      .prose-add-ch { font-family:var(--font-mono); font-size:11px; padding:8px 12px; border:none; background:transparent; cursor:pointer; color:var(--gray-400); border-right:var(--border-thin); white-space:nowrap; }
      .prose-add-ch:hover { color:var(--black); background:var(--gray-100); }
      .prose-ch-title-row { display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:var(--border-thin); background:var(--white); }
      .prose-ch-title-input { font-family:var(--font-serif); font-size:14px; font-weight:600; border:none; outline:none; flex:1; background:transparent; color:var(--black); }
      .prose-ch-title-input::placeholder { color:var(--gray-400); font-weight:400; }
      .prose-editor-area { min-height:500px; padding:28px 36px; font-family:Georgia,serif; font-size:17px; line-height:2; color:var(--black); outline:none; }
      .prose-editor-area:empty::before { content:attr(data-placeholder); color:var(--gray-400); pointer-events:none; font-style:italic; }
      .prose-editor-area h2 { font-family:var(--font-serif); font-size:22px; font-weight:700; margin:1.2em 0 0.5em; }
      .prose-editor-area h3 { font-family:var(--font-serif); font-size:18px; font-weight:700; margin:1em 0 0.4em; }
      .prose-editor-area p { margin-bottom:0.8em; }
      .prose-editor-area blockquote { border-left:3px solid var(--gray-400); margin:1em 0 1em 1em; padding-left:1em; color:var(--gray-600); font-style:italic; }
      .prose-editor-area ul,.prose-editor-area ol { margin:0.5em 0 0.5em 1.5em; }
      .prose-editor-area li { margin-bottom:0.3em; }
      .prose-editor-area a { color:var(--red); }
      .prose-footer { display:flex; align-items:center; gap:12px; padding:10px 16px; border-top:var(--border-thin); background:var(--off-white); }
      .prose-word-count { font-family:var(--font-mono); font-size:11px; color:var(--gray-400); }
      .prose-autosave-note { font-size:11px; color:var(--gray-400); margin-left:auto; }
      .prose-viewer-area { padding:28px 36px; font-family:Georgia,serif; font-size:17px; line-height:2; color:var(--black); }
      .prose-viewer-area h2 { font-family:var(--font-serif); font-size:22px; font-weight:700; margin:1.2em 0 0.5em; }
      .prose-viewer-area h3 { font-family:var(--font-serif); font-size:18px; font-weight:700; margin:1em 0 0.4em; }
      .prose-viewer-area p { margin-bottom:0.8em; }
      .prose-viewer-area blockquote { border-left:3px solid var(--gray-400); margin:1em 0 1em 1em; padding-left:1em; color:var(--gray-600); font-style:italic; }
      .prose-viewer-area ul,.prose-viewer-area ol { margin:0.5em 0 0.5em 1.5em; }
      .prose-viewer-area li { margin-bottom:0.3em; }
      .prose-viewer-nav { display:flex; align-items:center; justify-content:space-between; padding:12px 36px; border-top:var(--border-thin); border-bottom:var(--border-thin); margin-bottom:24px; }
      .prose-viewer-ch-name { font-family:var(--font-serif); font-size:14px; font-weight:700; }

      /* Upload zones */
      .upload-drop-zone { border:2px dashed var(--gray-400); padding:40px 24px; text-align:center; cursor:pointer; transition:all 0.12s; }
      .upload-drop-zone:hover { border-color:var(--black); background:var(--gray-100); }
      .upload-drop-label { font-size:13px; color:var(--gray-600); margin-top:8px; }

      /* Comic */
      .comic-strip { display:flex; flex-direction:column; align-items:center; background:#1a1a1a; padding:8px; gap:0; }
      .comic-page-wrap { position:relative; width:100%; max-width:800px; }
      .comic-page { width:100%; display:block; }
      .comic-page-delete { position:absolute; top:8px; right:8px; background:rgba(10,10,10,0.8); color:var(--white); border:none; cursor:pointer; font-size:12px; padding:4px 10px; opacity:0; transition:opacity 0.12s; }
      .comic-page-wrap:hover .comic-page-delete { opacity:1; }

      /* Image gallery */
      .image-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:8px; margin-top:12px; }
      .image-grid-item { position:relative; aspect-ratio:1; overflow:hidden; border:var(--border-thin); background:var(--off-white); }
      .image-grid-item img { width:100%; height:100%; object-fit:cover; display:block; }
      .image-grid-delete { position:absolute; top:4px; right:4px; background:rgba(10,10,10,0.8); color:var(--white); border:none; cursor:pointer; font-size:11px; padding:2px 6px; opacity:0; transition:opacity 0.12s; }
      .image-grid-item:hover .image-grid-delete { opacity:1; }

      /* PDF */
      .pdf-viewer-wrap { border:var(--border); background:var(--white); }
      .pdf-viewer-bar { display:flex; align-items:center; gap:8px; padding:10px 14px; border-bottom:var(--border-thin); background:var(--off-white); }
      .pdf-embed { width:100%; height:750px; border:none; display:block; }

      /* VN blocks */
      .vn-blocks { display:flex; flex-direction:column; gap:10px; }
      .vn-block { border:var(--border-thin); background:var(--white); }
      .vn-block-header { display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--off-white); border-bottom:var(--border-thin); font-family:var(--font-mono); font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--gray-600); }
      .vn-text-area { width:100%; padding:14px 16px; font-family:Georgia,serif; font-size:15px; line-height:1.85; border:none; resize:vertical; min-height:100px; outline:none; background:var(--white); color:var(--black); }
      .vn-text-area:focus { background:#fffdf9; }
      .vn-image-block img { width:100%; display:block; max-height:520px; object-fit:contain; background:var(--off-white); }
      .vn-add-bar { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
      .vn-block-remove { background:none; border:none; cursor:pointer; color:var(--gray-400); font-size:16px; margin-left:auto; transition:color 0.1s; padding:0 2px; }
      .vn-block-remove:hover { color:var(--red); }

      /* Comments */
      .comments-section { margin-top:40px; padding-top:28px; border-top:var(--border); }
      .comments-title { font-family:var(--font-serif); font-size:22px; font-weight:700; margin-bottom:20px; }
      .comment-item { padding:14px 0; border-bottom:var(--border-thin); }
      .comment-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
      .comment-author { font-size:12px; font-weight:600; font-family:var(--font-mono); }
      .comment-date { font-size:11px; color:var(--gray-400); }
      .comment-body { font-size:14px; line-height:1.65; color:var(--black); white-space:pre-wrap; }
      .comment-delete { background:none; border:none; cursor:pointer; color:var(--gray-400); font-size:11px; margin-left:auto; padding:0; transition:color 0.1s; }
      .comment-delete:hover { color:var(--red); }
      .comment-form { margin-top:20px; display:flex; flex-direction:column; gap:8px; }

      /* Landing */
      .landing-hero { border-bottom:var(--border); background:var(--white); padding:80px 32px 64px; text-align:center; position:relative; }
      .hero-eyebrow { display:inline-block; font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; background:var(--white); border:var(--border-thin); border-radius:var(--radius-pill); padding:5px 16px; color:var(--black); margin-bottom:20px; }
      .hero-title { font-family:var(--font-serif); font-size:clamp(42px,7vw,76px); line-height:0.98; letter-spacing:0.5px; max-width:780px; margin:0 auto; }
      .hero-title em { font-style:normal; color:var(--red); -webkit-text-stroke:1.5px var(--black); }
      .hero-sub { font-size:15px; color:var(--gray-600); line-height:1.7; max-width:520px; margin:22px auto 0; }
      .hero-actions { display:flex; gap:12px; margin-top:32px; flex-wrap:wrap; justify-content:center; }
      .features-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); border-top:var(--border); }
      .feature-card { border-right:var(--border-thin); border-bottom:var(--border-thin); padding:30px 24px; }
      .feature-card:last-child { border-right:none; }
      .feature-icon { font-family:var(--font-serif); font-size:26px; color:var(--red); margin-bottom:10px; }
      .feature-title { font-family:var(--font-sans); font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.03em; margin-bottom:6px; }
      .feature-desc { font-size:13px; color:var(--gray-600); line-height:1.6; }
      .section-label { font-family:var(--font-serif); font-size:14px; letter-spacing:0.4px; color:var(--gray-600); padding:14px 32px; border-bottom:var(--border-thin); background:var(--gray-100); }
    `}</style>
  );
}