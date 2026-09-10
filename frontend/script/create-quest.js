/* =============================================================================
   QUIZZHUB — create-quest.js
   Pilotage de l'interface de création uniquement.
   Rien n'est enregistré ni envoyé : le backend prendra le relais.
   ========================================================================== */

(function () {
    "use strict";

    /* --- Raccourcis --- */
    const $ = (sel) => document.querySelector(sel);

    const stage1   = $("#stage-1");
    const stage2   = $("#stage-2");
    const stepper  = $("#stepper").children;

    const form     = $("#setup-form");
    const errorBox = $("#setup-error");

    const deck     = $("#deck");
    const dots     = $("#dots");
    const btnPrev  = $("#btn-prev");
    const btnNext  = $("#btn-next");

    const tplSlide  = $("#tpl-slide");
    const tplAnswer = $("#tpl-answer");

    /* --- Réglages --- */
    const FORMES     = ["triangle", "diamond", "circle", "square", "triangle", "diamond"];
    const ANS_MIN    = 3;
    const ANS_MAX    = 6;

    let index    = 0;   // slide affichée
    let compteur = 0;   // sert à donner un nom unique aux radios "bonne réponse"

    /* -------------------------------------------------------------------------
       ÉTAPE 1 → ÉTAPE 2
    ----------------------------------------------------------------------------*/
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const titre = $("#quiz-title").value.trim();
        const theme = form.querySelector("input[name='theme']:checked");

        if (!titre || !theme) {
            erreur(!titre
                ? "Il manque le titre du questionnaire."
                : "Choisis un thème pour ton questionnaire.");
            (!titre ? $("#quiz-title") : form.querySelector(".picks")).scrollIntoView({
                block: "center", behavior: "smooth"
            });
            if (!titre) $("#quiz-title").focus();
            return;
        }

        errorBox.hidden = true;

        // Rappel des infos en haut de l'étape 2
        $("#recap-title").textContent = titre;
        $("#recap-theme").textContent = theme.dataset.emoji + " " + theme.value;

        stage1.hidden = true;
        stage2.hidden = false;
        stepper[0].classList.remove("is-on");
        stepper[0].classList.add("is-done");
        stepper[1].classList.add("is-on");

        if (!deck.children.length) ajouterSlide();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    $("#btn-back").addEventListener("click", () => {
        stage2.hidden = true;
        stage1.hidden = false;
        stepper[1].classList.remove("is-on");
        stepper[0].classList.remove("is-done");
        stepper[0].classList.add("is-on");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    function erreur(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        errorBox.classList.remove("shake");
        void errorBox.offsetWidth;      // relance l'animation
        errorBox.classList.add("shake");
    }

    /* -------------------------------------------------------------------------
       SLIDES
    ----------------------------------------------------------------------------*/
    function ajouterSlide() {
        const slide = tplSlide.content.firstElementChild.cloneNode(true);
        slide.dataset.id = ++compteur;

        // Les 3 réponses minimum
        for (let i = 0; i < ANS_MIN; i++) ajouterReponse(slide);

        slide.querySelector(".add-answer").addEventListener("click", () => {
            ajouterReponse(slide);
            majBoutonsReponses(slide);
        });

        deck.appendChild(slide);
        index = deck.children.length - 1;
        majDeck("next");
    }

    function ajouterReponse(slide) {
        const zone = slide.querySelector(".answers");
        if (zone.children.length >= ANS_MAX) return;

        const rang     = zone.children.length;
        const reponse  = tplAnswer.content.firstElementChild.cloneNode(true);

        reponse.classList.add("answer--" + (rang + 1));
        reponse.querySelector(".shape").classList.add("shape--" + FORMES[rang]);
        reponse.querySelector(".answer__good input").name = "good-" + slide.dataset.id;

        reponse.querySelector(".answer__del").addEventListener("click", () => {
            if (zone.children.length <= ANS_MIN) return;
            reponse.remove();
            recolorer(zone);
            majBoutonsReponses(slide);
        });

        zone.appendChild(reponse);
        majBoutonsReponses(slide);
    }

    /* Après une suppression, on remet les couleurs et les formes dans l'ordre */
    function recolorer(zone) {
        [...zone.children].forEach((rep, i) => {
            rep.className = "answer answer--" + (i + 1);
            rep.querySelector(".shape").className = "shape shape--" + FORMES[i];
        });
    }

    function majBoutonsReponses(slide) {
        const zone   = slide.querySelector(".answers");
        const nombre = zone.children.length;

        slide.querySelector(".add-answer").hidden = nombre >= ANS_MAX;
        zone.querySelectorAll(".answer__del").forEach((btn) => {
            btn.hidden = nombre <= ANS_MIN;
        });
    }

    /* --- Affichage : une seule slide visible, flèches selon la position --- */
    function majDeck(sens) {
        const slides = [...deck.children];

        slides.forEach((slide, i) => {
            const active = i === index;
            slide.classList.toggle("is-active", active);
            if (active) {
                slide.classList.remove("from-left", "from-right");
                void slide.offsetWidth;
                slide.classList.add(sens === "prev" ? "from-left" : "from-right");
            }
            slide.querySelector(".slide__num").textContent = i + 1;
        });

        // Flèches : pas de gauche sur la première, pas de droite sur la dernière
        btnPrev.hidden = index === 0;
        btnNext.hidden = index === slides.length - 1;

        $("#cur").textContent   = index + 1;
        $("#total").textContent = slides.length;

        dots.innerHTML = "";
        slides.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "dot" + (i === index ? " is-on" : "");
            dot.setAttribute("aria-label", "Aller à la question " + (i + 1));
            dot.addEventListener("click", () => {
                const sens = i < index ? "prev" : "next";
                index = i;
                majDeck(sens);
            });
            dots.appendChild(dot);
        });
    }

    /* -------------------------------------------------------------------------
       NAVIGATION
    ----------------------------------------------------------------------------*/
    btnNext.addEventListener("click", () => {
        if (index < deck.children.length - 1) { index++; majDeck("next"); }
    });

    btnPrev.addEventListener("click", () => {
        if (index > 0) { index--; majDeck("prev"); }
    });

    $("#btn-add-question").addEventListener("click", ajouterSlide);

    /* Flèches du clavier, quand on n'est pas en train d'écrire */
    document.addEventListener("keydown", (e) => {
        if (stage2.hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
        if (e.key === "ArrowRight") btnNext.click();
        if (e.key === "ArrowLeft")  btnPrev.click();
    });

    /* -------------------------------------------------------------------------
       BOUTONS SANS EFFET (le backend s'en chargera)
    ----------------------------------------------------------------------------*/
    ["#btn-save", "#btn-finish"].forEach((sel) => {
        $(sel).addEventListener("click", () => {
            const b = $(sel);
            const texte = b.textContent;
            b.textContent = "Enregistré ✓";
            b.disabled = true;
            setTimeout(() => { b.textContent = texte; b.disabled = false; }, 1600);
        });
    });
})();
