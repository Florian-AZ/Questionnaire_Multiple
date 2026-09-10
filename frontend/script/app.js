/* Quizzhub: same-origin API, no build step or external service required. */
"use strict";
const $ = (selector, root = document) => root.querySelector(selector);
const main = $("#main");
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const simple = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const storage = {
  get(key, fallback = "") { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};
let toastTimer;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("#toast").hidden = true; }, 3500);
}
async function api(path, body) {
  let response;
  try {
    response = await fetch("/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : {"Content-Type":"application/json"},
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    throw new Error("Le serveur ne répond pas. Vérifie qu'il est démarré, puis réessaie.");
  }
  let data;
  try { data = await response.json(); } catch { throw new Error("Le serveur a renvoyé une réponse inattendue."); }
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map(item => item.msg).join(" ")
      : data.detail;
    throw new Error(detail || "Impossible de terminer cette action. Réessaie.");
  }
  return data;
}
function showError(error) {
  main.innerHTML = '<div class="shell"><div class="empty" style="margin-top:50px"><h2>Petite pause technique</h2><p role="alert">' + escapeHTML(error.message) + '</p><button class="btn" id="retry">Réessayer ↻</button></div></div>';
  $("#retry").onclick = () => location.reload();
}
function art(theme, label = true) {
  const t = simple(theme);
  const kind = /scien|nature/.test(t) ? "science" : /cine|divert/.test(t) ? "cinema" : /culture|histoire/.test(t) ? "culture" : "other";
  const graphic = {science:'<span class="planet"></span>',cinema:'<span class="clapper"></span>',culture:'<span class="gamepad"></span>',other:'<span class="book">?</span>'}[kind];
  return '<div class="card-art art-' + kind + '" aria-hidden="true">' + (label ? '<span class="category-label">' + escapeHTML(theme || "À découvrir") + '</span>' : "") + graphic + '</div>';
}
function card(quiz) {
  return '<a class="quiz-card" href="/jouer?id=' + quiz.ID + '">' + art(quiz.Type) +
    '<div class="card-body"><div class="meta"><span>' + quiz.question_count + ' question' + (quiz.question_count === 1 ? '' : 's') + '</span><span>≈ ' + Math.max(1, Math.ceil(quiz.question_count * .5)) + ' min</span></div>' +
    '<h3>' + escapeHTML(quiz.Name) + '</h3><p class="author">Par ' + escapeHTML(quiz.auteur) + '</p><div class="card-bottom"><span>' +
    (quiz.playable ? quiz.participations + ' partie' + (quiz.participations === 1 ? "" : "s") + ' · ' + (quiz.participations ? Math.round(quiz.Note_Moyenne) + ' % de réussite' : 'À toi de jouer !') : "Questions à compléter") +
    '</span><span class="arrow" aria-label="Jouer">↗</span></div></div></a>';
}
function banner() {
  return '<aside class="create-banner"><span class="banner-icon" aria-hidden="true">✳</span><div><h2>À ton tour de poser les questions.</h2><p>Une passion, une idée, un défi ? Transforme-les en quiz.</p></div><a class="btn" href="/creer">Créer mon quiz <span aria-hidden="true">↗</span></a></aside>';
}
async function catalogue(home) {
  document.title = home ? "Quizzhub — Cultive ta curiosité" : "Explorer les quiz — Quizzhub";
  const quizzes = await api("/quiz/");
  const themes = [...new Set(quizzes.map(q => q.Type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr"));
  const totalQuestions = quizzes.reduce((sum,q) => sum + q.question_count, 0);
  const header = home ? '<section class="hero"><div><p class="eyebrow">Le rendez-vous des esprits curieux</p><h1>La curiosité<br>se <em>cultive.</em></h1><p class="description">Un sujet qui te passionne, une question qui te surprend. Découvre le plaisir d’apprendre en jouant.</p><div class="actions"><a class="btn" href="/catalogue">Trouver mon prochain quiz <span aria-hidden="true">↗</span></a><a class="btn text" href="/creer">Ou créer le mien</a></div><div class="hero-foot"><div class="avatars" aria-hidden="true"><span>✿</span><span>✦</span><span>☺</span></div><span>À ton rythme. Juste pour le plaisir.</span></div></div><div class="hero-art" aria-label="Illustration : un exemple de question sur la planète Mars"><span class="art-star" aria-hidden="true">✳</span><div class="sample-quiz"><div class="sample-top"><span>LA QUESTION DU JOUR</span><span>01 / 10</span></div><h2>Quelle planète porte<br>le surnom de<br>« planète rouge » ?</h2><div class="sample-answer"><b>A</b> Vénus</div><div class="sample-answer right"><b>B</b> Mars <span>✓</span></div><div class="sample-answer"><b>C</b> Jupiter</div></div><span class="mini-star" aria-hidden="true">✦</span><span class="floating-pill">✧ Une découverte à chaque question</span></div></section><div class="stats"><div class="stat"><b>' + quizzes.length + '</b><span>quiz à découvrir</span></div><div class="stat"><b>' + totalQuestions + '</b><span>questions pour apprendre</span></div><div class="stat"><b>' + themes.length + '</b><span>univers à explorer</span></div></div><div class="section-heading"><div><p class="eyebrow">À toi de jouer</p><h2>Ta prochaine découverte</h2><p>Choisis un univers. Laisse ta curiosité faire le reste.</p></div><a class="text-link" href="/catalogue">Tout explorer ↗</a></div>' :
    '<div class="page-heading"><p class="eyebrow">Un monde de questions</p><h1>Explore. Joue. Découvre.</h1><p>Du cinéma aux sciences, trouve le quiz qui éveille ta curiosité.</p></div>';
  main.innerHTML = '<div class="shell">' + header + '<section aria-label="Catalogue des questionnaires"><div class="filters"><div class="chips" id="chips"></div><label class="search"><span aria-hidden="true">⌕</span><input type="search" class="input" id="search" placeholder="Un sujet, un quiz…" aria-label="Rechercher un questionnaire"></label></div><div class="results-line"><span id="count" aria-live="polite"></span><label>Trier : <select class="sort" id="sort"><option value="recent">Les plus récents</option><option value="popular">Les plus joués</option><option value="short">Les plus courts</option></select></label></div><div class="grid" id="grid"></div></section>' + banner() + '</div>';
  let theme = new URLSearchParams(location.search).get("theme") || "";
  if (!themes.includes(theme)) theme = "";
  ["", ...themes].forEach(t => {
    const button = document.createElement("button");
    button.className = "chip" + (theme === t ? " active" : "");
    button.textContent = t || "Tout explorer";
    button.setAttribute("aria-pressed", String(theme === t));
    button.onclick = () => {
      theme = t;
      [...$("#chips").children].forEach(el => { el.classList.toggle("active", el === button); el.setAttribute("aria-pressed",String(el === button)); });
      filter();
    };
    $("#chips").append(button);
  });
  function filter() {
    const query = simple($("#search").value.trim());
    const sort = $("#sort").value;
    const matches = quizzes.filter(q => (!theme || q.Type === theme) && simple(q.Name + " " + q.Type + " " + q.auteur).includes(query))
      .sort((a,b) => sort === "popular" ? b.participations-a.participations || b.ID-a.ID : sort === "short" ? a.question_count-b.question_count || b.ID-a.ID : b.ID-a.ID);
    $("#count").textContent = matches.length + " questionnaire" + (matches.length === 1 ? "" : "s") + (home && matches.length > 6 ? " · aperçu des 6 premiers" : "");
    $("#grid").innerHTML = matches.length ? (home ? matches.slice(0,6) : matches).map(card).join("") :
      '<div class="empty"><h2>' + (quizzes.length ? "Pas encore de match." : "Tout commence par une question.") + '</h2><p>' + (quizzes.length ? "Essaie un autre mot ou un autre thème." : "Le catalogue est vide. Crée ton premier questionnaire pour commencer.") + '</p><a class="btn secondary" href="' + (quizzes.length ? "/catalogue" : "/creer") + '">' + (quizzes.length ? "Réinitialiser les filtres" : "Créer un quiz") + '</a></div>';
  }
  $("#search").oninput = filter;
  $("#sort").onchange = filter;
  filter();
}
function createQuiz() {
  document.title = "Créer un quiz — Quizzhub";
  const draftKey = "quizzhub-draft-v1";
  const newQuestion = () => ({Question:"", reponses:[{Rep:"",Is_Correct:"Vrai"},{Rep:"",Is_Correct:"Faux"},{Rep:"",Is_Correct:"Faux"},{Rep:"",Is_Correct:"Faux"}]});
  let draft = {Name:"",Type:"Culture générale",Username:storage.get("quizzhub-name"),questions:[newQuestion()]};
  let restored = false;
  try {
    const saved = JSON.parse(storage.get(draftKey,"null"));
    if (saved && typeof saved.Name === "string" && typeof saved.Type === "string" && typeof saved.Username === "string" &&
        Array.isArray(saved.questions) && saved.questions.length > 0 && saved.questions.length <= 50 &&
        saved.questions.every(q => typeof q.Question === "string" && Array.isArray(q.reponses) && q.reponses.length >= 2 && q.reponses.length <= 6 &&
          q.reponses.every(a => typeof a.Rep === "string" && ["Vrai","Faux"].includes(a.Is_Correct)))) {
      draft = saved; restored = true;
    }
  } catch { /* Invalid or unavailable browser storage: start a fresh form. */ }
  let savedOkay = true;
  function persist() { savedOkay = storage.set(draftKey, JSON.stringify(draft)); }
  main.innerHTML = '<div class="shell"><div class="page-heading"><p class="eyebrow">Le studio des curieux</p><h1>Les bonnes questions, c’est toi.</h1><p>Choisis un sujet, ajoute tes questions et lance ton quiz.</p></div><form id="editor-form"><div class="editor"><aside class="panel editor-sidebar"><h2>01. Le point de départ</h2><label class="field">Titre du quiz<input type="text" id="quiz-title" maxlength="120" placeholder="Ex. Les secrets du cinéma" required></label><label class="field">Univers<select id="quiz-theme">' + ["Culture générale","Sciences","Cinéma","Histoire","Géographie","Sport","Musique","Technologie","Autre"].map(t=>'<option>'+t+'</option>').join("") + '</select></label><label class="field">Ton pseudo<input type="text" id="quiz-author" maxlength="100" placeholder="Ex. Camille"><small>Affiché comme auteur. Pas besoin de compte.</small></label><p class="editor-tip"><b>Le secret d’un bon quiz ?</b><br>Une question claire, 2 à 6 réponses différentes et une seule bonne réponse.<br><br>Ton brouillon est conservé dans ce navigateur.</p></aside><div><div class="notice success" id="draft-status" role="status"' + (restored ? "" : " hidden") + '>Ton brouillon a été restauré.</div><div id="questions"></div><button type="button" class="add-question" id="add-question">＋ Ajouter une question</button><div id="form-error" class="notice" role="alert" hidden></div><div class="publish-bar"><button class="btn secondary" type="button" id="save-draft">Garder le brouillon</button><button class="btn" type="submit" id="publish">Publier le quiz ↗</button></div></div></div></form></div>';
  $("#quiz-title").value = draft.Name;
  if (![...$("#quiz-theme").options].some(o=>o.value===draft.Type)) {
    const option = new Option(draft.Type,draft.Type); $("#quiz-theme").add(option);
  }
  $("#quiz-theme").value = draft.Type;
  $("#quiz-author").value = draft.Username;
  [["#quiz-title","Name"],["#quiz-theme","Type"],["#quiz-author","Username"]].forEach(([selector,key]) => {
    $(selector).oninput = e => { draft[key] = e.target.value; persist(); };
  });
  function renderQuestions() {
    $("#questions").innerHTML = draft.questions.map((q,i) =>
      '<section class="panel question-editor"><div class="question-heading"><h2>Question ' + String(i+1).padStart(2,"0") + '</h2><button type="button" class="icon-btn remove-question" data-i="' + i + '"' + (draft.questions.length === 1 ? " disabled" : "") + '>Supprimer</button></div><label class="field">Ta question<textarea class="question-text" data-i="' + i + '" maxlength="150" placeholder="Qu’as-tu envie de leur apprendre ?" required>' + escapeHTML(q.Question) + '</textarea></label><p class="answer-hint">Coche le cercle de la bonne réponse.</p>' +
      q.reponses.map((a,j) => '<div class="answer-edit"><label><input type="radio" class="correct-answer" name="correct-' + i + '" data-i="' + i + '" data-j="' + j + '" aria-label="Réponse ' + (j+1) + ' correcte pour la question ' + (i+1) + '"' + (a.Is_Correct === "Vrai" ? " checked" : "") + ' required></label><input type="text" class="answer-text" data-i="' + i + '" data-j="' + j + '" maxlength="150" value="' + escapeHTML(a.Rep) + '" placeholder="Réponse ' + (j+1) + '" aria-label="Réponse ' + (j+1) + ' de la question ' + (i+1) + '" required><button type="button" class="icon-btn remove-answer" data-i="' + i + '" data-j="' + j + '" aria-label="Supprimer la réponse ' + (j+1) + '"' + (q.reponses.length<=2 ? " disabled" : "") + '>×</button></div>').join("") +
      '<div class="editor-toolbar"><button type="button" class="btn text add-answer" data-i="' + i + '"' + (q.reponses.length>=6 ? " disabled" : "") + '>＋ Ajouter une réponse</button><span class="answer-hint">' + q.reponses.length + ' / 6 réponses</span></div></section>'
    ).join("");
    $("#add-question").disabled = draft.questions.length >= 50;
    $("#questions").querySelectorAll(".question-text").forEach(el => el.oninput = () => { draft.questions[el.dataset.i].Question = el.value; persist(); });
    $("#questions").querySelectorAll(".answer-text").forEach(el => el.oninput = () => { draft.questions[el.dataset.i].reponses[el.dataset.j].Rep = el.value; persist(); });
    $("#questions").querySelectorAll(".correct-answer").forEach(el => el.onchange = () => { draft.questions[el.dataset.i].reponses.forEach((a,j)=>a.Is_Correct = j===Number(el.dataset.j) ? "Vrai":"Faux"); persist(); });
    $("#questions").querySelectorAll(".remove-question").forEach(el => el.onclick = () => { if(draft.questions.length>1) {draft.questions.splice(Number(el.dataset.i),1);persist();renderQuestions();} });
    $("#questions").querySelectorAll(".add-answer").forEach(el => el.onclick = () => { draft.questions[el.dataset.i].reponses.push({Rep:"",Is_Correct:"Faux"});persist();renderQuestions(); });
    $("#questions").querySelectorAll(".remove-answer").forEach(el => el.onclick = () => {
      const answers = draft.questions[el.dataset.i].reponses;
      if (answers.length<=2) return;
      answers.splice(Number(el.dataset.j),1);
      if (!answers.some(a=>a.Is_Correct==="Vrai")) answers[0].Is_Correct="Vrai";
      persist();renderQuestions();
    });
  }
  renderQuestions();
  $("#add-question").onclick = () => {
    if (draft.questions.length >= 50) return;
    draft.questions.push(newQuestion()); persist(); renderQuestions();
    const last = $("#questions").lastElementChild;
    last.scrollIntoView({behavior:"smooth",block:"start"}); $("textarea",last).focus({preventScroll:true});
  };
  $("#save-draft").onclick = () => {
    persist(); toast(savedOkay ? "Brouillon enregistré dans ce navigateur." : "Le stockage du navigateur est indisponible. Garde cette page ouverte.");
  };
  let publishing = false;
  $("#editor-form").onsubmit = async event => {
    event.preventDefault();
    if (publishing) return;
    const errorBox = $("#form-error");
    errorBox.hidden = true;
    try {
      if (!draft.Name.trim()) throw new Error("Ajoute un titre à ton quiz.");
      draft.questions.forEach((q,i) => {
        if (!q.Question.trim() || q.reponses.some(a=>!a.Rep.trim())) throw new Error("Complète la question " + (i+1) + " et toutes ses réponses.");
        if (new Set(q.reponses.map(a=>a.Rep.trim().toLocaleLowerCase("fr"))).size !== q.reponses.length) throw new Error("Question " + (i+1) + " : les réponses doivent être différentes.");
      });
      publishing = true;
      $("#publish").disabled = true; $("#publish").textContent = "Publication…";
      // Snapshot before awaiting; preserve form contents on network/database errors.
      const payload = JSON.parse(JSON.stringify({...draft,Username:draft.Username.trim() || "Anonyme"}));
      const quiz = await api("/quiz/", payload);
      storage.set("quizzhub-name",payload.Username);
      storage.remove(draftKey);
      location.href = "/jouer?id=" + quiz.ID + "&created=1";
    } catch (error) {
      errorBox.textContent = error.message; errorBox.hidden = false;
      errorBox.scrollIntoView({behavior:"smooth",block:"center"});
      publishing = false; $("#publish").disabled = false; $("#publish").textContent = "Publier le quiz ↗";
    }
  };
}
async function playQuiz() {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Choisis un questionnaire depuis le catalogue.");
  const quiz = await api("/quiz/" + id);
  document.title = quiz.Name + " — Quizzhub";
  // Shuffle once while retaining answer IDs for server-side correction.
  quiz.questions.forEach(q => {
    for(let i=q.reponses.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [q.reponses[i],q.reponses[j]]=[q.reponses[j],q.reponses[i]];
    }
  });
  let index = 0, name = storage.get("quizzhub-name"), answers = {}, sending = false;
  main.innerHTML = '<div class="shell"><div class="play-shell"><a class="back-link" href="/catalogue">← Retour aux quiz</a><div id="game"></div></div></div>';
  const game = $("#game");
  function intro() {
    game.innerHTML = (params.has("created") ? '<div class="notice success" role="status">Ton quiz est publié ! Il est maintenant disponible dans le catalogue.</div>' : "") + '<section class="panel intro">' + art(quiz.Type,false) + '<h1>' + escapeHTML(quiz.Name) + '</h1><p class="description">Une bonne dose de curiosité, et c’est parti.<br>La correction t’attend à la fin du quiz.</p><div class="intro-details"><span>' + quiz.questions.length + ' question' + (quiz.questions.length === 1 ? '' : 's') + '</span><span>≈ ' + Math.max(1,Math.ceil(quiz.questions.length*.5)) + ' min</span><span>' + escapeHTML(quiz.Type) + '</span></div><form id="start-form"><label class="field">Ton pseudo <input type="text" id="player-name" maxlength="100" placeholder="Anonyme" value="' + escapeHTML(name) + '"><small>Il sera associé à ta participation, sans créer de compte.</small></label><button class="btn" type="submit">C’est parti ! ↗</button></form></section>';
    $("#start-form").onsubmit = e => { e.preventDefault(); name = $("#player-name").value.trim() || "Anonyme";storage.set("quizzhub-name",name);renderQuestion(); };
  }
  function renderQuestion() {
    const q = quiz.questions[index];
    game.innerHTML = '<div class="play-progress"><span>' + escapeHTML(quiz.Type) + '</span><span>Question ' + (index+1) + ' sur ' + quiz.questions.length + '</span></div><div class="progress" role="progressbar" aria-label="Progression du questionnaire" aria-valuemin="0" aria-valuemax="' + quiz.questions.length + '" aria-valuenow="' + index + '"><span style="width:' + index/quiz.questions.length*100 + '%"></span></div><section class="panel question-panel"><p class="eyebrow">À toi de choisir</p><h1 tabindex="-1" id="current-question">' + escapeHTML(q.Question) + '</h1><div class="play-answers">' +
      q.reponses.map((a,j)=>'<button type="button" class="answer-option' + (answers[q.ID] === a.ID ? " selected":"") + '" data-id="' + a.ID + '" aria-pressed="' + (answers[q.ID] === a.ID) + '"><b>' + String.fromCharCode(65+j) + '</b><span>' + escapeHTML(a.Rep) + '</span></button>').join("") +
      '</div><div class="question-nav"><button type="button" class="btn secondary" id="previous"' + (index===0 ? " disabled":"") + '>← Précédente</button><button type="button" class="btn" id="next"' + (!answers[q.ID] ? " disabled":"") + '>' + (index === quiz.questions.length-1 ? "Voir mon résultat ↗" : "Suivante →") + '</button></div><div class="notice" id="submit-error" role="alert" hidden></div></section><p class="game-help">Une seule bonne réponse. Prends le temps de réfléchir.</p>';
    game.querySelectorAll(".answer-option").forEach(button => button.onclick = () => {
      if(sending) return;
      answers[q.ID] = Number(button.dataset.id);
      game.querySelectorAll(".answer-option").forEach(el => {
        el.classList.toggle("selected", el === button); el.setAttribute("aria-pressed",String(el === button));
      });
      $("#next").disabled = false;
    });
    $("#previous").onclick = () => { if(index>0 && !sending) {index--;renderQuestion();$("#current-question").focus();} };
    $("#next").onclick = async () => {
      if(sending || !answers[q.ID]) return;
      if(index < quiz.questions.length-1) { index++;renderQuestion();$("#current-question").focus();return; }
      sending = true; $("#next").disabled=true;$("#previous").disabled=true;$("#next").textContent="Correction…";
      game.querySelectorAll(".answer-option").forEach(el=>el.disabled=true);
      try {
        const result = await api("/quiz/" + id + "/participer/", {Username:name,answers:quiz.questions.map(q=>({question_id:q.ID,reponse_id:answers[q.ID] ?? null}))});
        renderResult(result);
      } catch(error) {
        $("#submit-error").textContent=error.message;$("#submit-error").hidden=false;
        $("#next").disabled=false;$("#next").textContent="Réessayer l’envoi ↗";$("#previous").disabled=index===0;
        game.querySelectorAll(".answer-option").forEach(el=>el.disabled=false);
      } finally { sending=false; }
    };
  }
  function renderResult(result) {
    const title = result.score===100 ? "Un sans-faute. Chapeau !" : result.score>=50 ? "Bien joué, esprit curieux !" : "Chaque question t’apprend quelque chose.";
    game.innerHTML = '<section class="panel result"><p class="eyebrow">Le plaisir d’apprendre</p><h1 tabindex="-1" id="result-title">' + title + '</h1><div class="score-ring" style="--score:' + result.score + '%"><div><b>' + Math.round(result.score) + ' %</b><span>de bonnes réponses</span></div></div><p>' + result.correct + ' bonne' + (result.correct===1 ? "" : "s") + ' réponse' + (result.correct===1 ? "" : "s") + ' sur ' + result.total + ' · Participation enregistrée</p><div class="actions"><button class="btn" id="replay">Rejouer ↻</button><a class="btn secondary" href="/catalogue">Explorer d’autres quiz ↗</a></div></section><section class="corrections"><h2>Les réponses, et un peu plus de savoir.</h2>' +
      result.corrections.map((c,i)=>'<article class="correction"><h3><span class="' + (c.correct ? "good":"bad") + '">' + (c.correct ? "✓":"×") + '</span> ' + (i+1) + '. ' + escapeHTML(c.question) + '</h3><p>Ta réponse : ' + escapeHTML(c.reponse || "Sans réponse") + '</p>' + (c.correct ? '<p class="good">C’est la bonne réponse !</p>' : '<p class="good">Bonne réponse : ' + escapeHTML(c.bonne_reponse) + '</p>') + '</article>').join("") + '</section>';
    $("#replay").onclick=()=>{index=0;answers={};renderQuestion();window.scrollTo({top:0,behavior:"smooth"});};
    $("#result-title").focus();window.scrollTo({top:0,behavior:"smooth"});
  }
  intro();
}
document.querySelectorAll("[data-nav]").forEach(link => {
  if (link.dataset.nav === location.pathname) link.setAttribute("aria-current","page");
});
(async () => {
  if(location.protocol==="file:") {
    showError(new Error("Lance Demarrer.bat dans le dossier du projet, puis ouvre http://127.0.0.1:8000."));
    return;
  }
  try {
    if(location.pathname==="/creer") createQuiz();
    else if(location.pathname==="/jouer") await playQuiz();
    else await catalogue(location.pathname!=="/catalogue");
  } catch(error) { showError(error); }
})();
