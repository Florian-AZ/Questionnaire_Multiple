/* =============================================================================
   QUIZZHUB — quiz.js
   Moteur de partie pour les questionnaires « maison » (quest1/2/3).
   Les questions sont écrites en dur dans chaque page, dans un bloc
   <script id="quiz-data" type="application/json">. Rien n'est envoyé nulle part.
   ========================================================================== */

(function () {
    "use strict";

    const $ = (sel) => document.querySelector(sel);

    const data = JSON.parse($("#quiz-data").textContent);

    /* Les réponses sont écrites dans l'ordre dans la page : on les mélange
       une fois au chargement pour que la bonne ne soit pas toujours au même endroit. */
    data.questions.forEach((q) => {
        const bonne = q.reponses[q.bonne];
        for (let i = q.reponses.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.reponses[i], q.reponses[j]] = [q.reponses[j], q.reponses[i]];
        }
        q.bonne = q.reponses.indexOf(bonne);
    });

    /* --- Réglages de jeu --- */
    const TEMPS     = 20;      // secondes par question
    const PTS_BASE  = 500;     // points pour une bonne réponse
    const PTS_VITE  = 500;     // bonus maximum de rapidité
    const PTS_SERIE = 100;     // bonus par question d'affilée (plafonné)
    const COULEURS  = ["red", "blue", "yellow", "green"];
    const FORMES    = ["triangle", "diamond", "circle", "square"];

    /* --- Écrans --- */
    const ecrans = { intro: $("#screen-intro"), jeu: $("#screen-play"), fin: $("#screen-end") };

    /* --- Éléments du jeu --- */
    const elQuestion = $("#question");
    const elNote     = $("#question-note");
    const elReponses = $("#answers");
    const elNum      = $("#q-num");
    const elScore    = $("#score");
    const elSerie    = $("#streak");
    const elJauge    = $("#timebar-fill");
    const elChrono   = $("#timer");

    const retour   = $("#feedback");
    const fbTitre  = $("#fb-title");
    const fbTexte  = $("#fb-text");
    const btnNext  = $("#btn-next");

    /* --- État --- */
    let index = 0, score = 0, bonnes = 0, serie = 0, meilleureSerie = 0;
    let reste = TEMPS, minuteur = null, verrou = false;
    const recap = [];

    /* -------------------------------------------------------------------------
       DÉMARRAGE
    ----------------------------------------------------------------------------*/
    $("#q-total").textContent = data.questions.length;
    document.querySelectorAll(".js-total").forEach((el) => {
        el.textContent = data.questions.length;
    });

    $("#btn-start").addEventListener("click", () => {
        montrer("jeu");
        poser();
    });

    $("#btn-replay").addEventListener("click", () => {
        index = 0; score = 0; bonnes = 0; serie = 0; meilleureSerie = 0;
        recap.length = 0;
        elScore.textContent = "0";
        montrer("jeu");
        poser();
    });

    btnNext.addEventListener("click", () => {
        index++;
        if (index < data.questions.length) poser();
        else terminer();
    });

    function montrer(nom) {
        Object.entries(ecrans).forEach(([cle, el]) => { el.hidden = cle !== nom; });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    /* -------------------------------------------------------------------------
       AFFICHER UNE QUESTION
    ----------------------------------------------------------------------------*/
    function poser() {
        const q = data.questions[index];

        verrou = false;
        retour.hidden = true;
        elNum.textContent = index + 1;

        elQuestion.textContent = q.question;
        elNote.textContent = q.precision || "";
        elNote.hidden = !q.precision;

        elReponses.innerHTML = "";
        q.reponses.forEach((texte, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "ans ans--" + COULEURS[i % 4];
            btn.innerHTML =
                '<i class="shape shape--' + FORMES[i % 4] + '" aria-hidden="true"></i>' +
                '<span class="ans__txt"></span>' +
                '<span class="ans__mark" aria-hidden="true"></span>';
            btn.querySelector(".ans__txt").textContent = texte;
            btn.addEventListener("click", () => repondre(i, btn));
            elReponses.appendChild(btn);
        });

        lancerChrono();
    }

    /* -------------------------------------------------------------------------
       CHRONO
    ----------------------------------------------------------------------------*/
    function lancerChrono() {
        clearInterval(minuteur);
        reste = TEMPS;
        majChrono();

        minuteur = setInterval(() => {
            reste = Math.max(0, reste - 0.1);
            majChrono();
            if (reste <= 0) repondre(-1, null);
        }, 100);
    }

    function majChrono() {
        elJauge.style.width = (reste / TEMPS * 100) + "%";
        elJauge.classList.toggle("is-low", reste <= 5);
        elChrono.textContent = Math.ceil(reste);
    }

    /* -------------------------------------------------------------------------
       RÉPONDRE
    ----------------------------------------------------------------------------*/
    function repondre(choix, bouton) {
        if (verrou) return;
        verrou = true;
        clearInterval(minuteur);

        const q     = data.questions[index];
        const juste = choix === q.bonne;
        let gagnes  = 0;

        if (juste) {
            serie++;
            meilleureSerie = Math.max(meilleureSerie, serie);
            bonnes++;
            gagnes = PTS_BASE
                   + Math.round(PTS_VITE * (reste / TEMPS))
                   + Math.min(serie - 1, 5) * PTS_SERIE;
            score += gagnes;
            elScore.textContent = score;
        } else {
            serie = 0;
        }

        elSerie.hidden = serie < 2;
        elSerie.textContent = "🔥 Série ×" + serie;

        // On révèle les réponses
        [...elReponses.children].forEach((btn, i) => {
            btn.disabled = true;
            if (i === q.bonne) btn.classList.add("is-right");
            else btn.classList.add("is-dim");
        });
        if (bouton && !juste) {
            bouton.classList.remove("is-dim");
            bouton.classList.add("is-wrong");
        }

        // Le retour du bas
        retour.hidden = false;
        retour.className = "feedback " + (juste ? "is-ok" : "is-ko");
        fbTitre.textContent = juste
            ? "Bien joué ! +" + gagnes + " pts"
            : (choix === -1 ? "Trop tard !" : "Raté…");
        fbTexte.textContent = q.explication || "";
        fbTexte.hidden = !q.explication;

        btnNext.textContent = index === data.questions.length - 1
            ? "Voir mon score →"
            : "Question suivante →";

        recap.push({ question: q.question, bonne: q.reponses[q.bonne], juste: juste });
    }

    /* --- Touches 1 à 4 --- */
    document.addEventListener("keydown", (e) => {
        if (ecrans.jeu.hidden) return;
        if (!verrou && /^[1-9]$/.test(e.key)) {
            const btn = elReponses.children[+e.key - 1];
            if (btn) btn.click();
        } else if (verrou && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            btnNext.click();
        }
    });

    /* -------------------------------------------------------------------------
       ÉCRAN DE FIN
    ----------------------------------------------------------------------------*/
    function terminer() {
        const total   = data.questions.length;
        const pourcent = Math.round(bonnes / total * 100);

        $("#end-score").textContent  = score;
        $("#end-good").textContent   = bonnes;
        $("#end-total").textContent  = total;
        $("#end-streak").textContent = meilleureSerie;
        $("#end-bar").style.width    = pourcent + "%";

        let titre, emoji;
        if (pourcent === 100)      { titre = "Sans-faute, chapeau !";      emoji = "🏆"; }
        else if (pourcent >= 80)   { titre = "Excellent !";                emoji = "🥇"; }
        else if (pourcent >= 60)   { titre = "Bien joué !";                emoji = "🥈"; }
        else if (pourcent >= 40)   { titre = "Pas mal, mais peut mieux faire"; emoji = "🥉"; }
        else                       { titre = "Aïe… la revanche s'impose";  emoji = "🙈"; }

        $("#end-title").textContent = titre;
        $("#end-emoji").textContent = emoji;

        const liste = $("#end-recap");
        liste.innerHTML = "";
        recap.forEach((ligne, i) => {
            const li = document.createElement("li");
            li.className = ligne.juste ? "is-ok" : "is-ko";
            li.innerHTML =
                '<span class="recap__num">' + (i + 1) + '</span>' +
                '<span class="recap__q"></span>' +
                '<span class="recap__a"></span>';
            li.querySelector(".recap__q").textContent = ligne.question;
            li.querySelector(".recap__a").textContent = ligne.bonne;
            liste.appendChild(li);
        });

        montrer("fin");
    }
})();
