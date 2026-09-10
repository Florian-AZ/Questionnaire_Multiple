/* =============================================================================
   QUIZZHUB — catalogue.js
   Filtrage / tri des questionnaires, côté navigateur uniquement.
   Les cartes de la sélection maison sont écrites en dur dans la page ;
   celles de la communauté viendront du backend.
   ========================================================================== */

(function () {
    "use strict";

    const $  = (sel) => document.querySelector(sel);
    const $$ = (sel) => [...document.querySelectorAll(sel)];

    const recherche = $("#q");
    const chips     = $$("#chips .chip");
    const niveau    = $("#level");
    const tri       = $("#sort");
    const reset     = $("#reset");

    const blocs = [
        { grille: $("#grid-createurs"),  compteur: $("#count-createurs"),  vide: $("#none-createurs") },
        { grille: $("#grid-communaute"), compteur: $("#count-communaute"), vide: $("#empty-communaute") }
    ];

    let theme = "tous";

    /* --- Normalisation : sans accents, en minuscules --- */
    const simple = (txt) =>
        txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    /* -------------------------------------------------------------------------
       FILTRAGE
    ----------------------------------------------------------------------------*/
    function filtrer() {
        const mots = simple(recherche.value.trim());
        const lvl  = niveau.value;

        blocs.forEach(({ grille, compteur, vide }) => {
            if (!grille) return;

            const cartes = [...grille.children];
            let visibles = 0;

            cartes.forEach((carte) => {
                const titre   = simple(carte.querySelector("h3")?.textContent || "");
                const mtsCles = simple(carte.dataset.search || "");
                const cTheme  = carte.dataset.theme || "";
                const cNiveau = carte.dataset.level || "";

                const okTexte  = !mots || titre.includes(mots) || mtsCles.includes(mots);
                const okTheme  = theme === "tous" || simple(cTheme) === simple(theme);
                const okNiveau = lvl === "tous" || cNiveau === lvl;

                const visible = okTexte && okTheme && okNiveau;
                carte.hidden = !visible;
                if (visible) visibles++;
            });

            compteur.textContent = visibles;
            if (vide) vide.hidden = visibles > 0;
        });

        trier();
    }

    /* -------------------------------------------------------------------------
       TRI
    ----------------------------------------------------------------------------*/
    function trier() {
        const mode = tri.value;

        blocs.forEach(({ grille }) => {
            if (!grille) return;

            [...grille.children]
                .sort((a, b) => {
                    if (mode === "recent") return b.dataset.date.localeCompare(a.dataset.date);
                    if (mode === "court")  return (+a.dataset.minutes) - (+b.dataset.minutes);
                    return (+b.dataset.plays) - (+a.dataset.plays);   // les plus joués
                })
                .forEach((carte) => grille.appendChild(carte));
        });
    }

    /* -------------------------------------------------------------------------
       ÉVÉNEMENTS
    ----------------------------------------------------------------------------*/
    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => c.classList.remove("is-on"));
            chip.classList.add("is-on");
            theme = chip.dataset.theme;
            filtrer();
        });
    });

    recherche.addEventListener("input", filtrer);
    niveau.addEventListener("change", filtrer);
    tri.addEventListener("change", filtrer);

    reset.addEventListener("click", () => {
        recherche.value = "";
        niveau.value = "tous";
        tri.value = "populaire";
        theme = "tous";
        chips.forEach((c) => c.classList.toggle("is-on", c.dataset.theme === "tous"));
        filtrer();
    });

    /* Thème passé dans l'URL (depuis l'accueil) : ?theme=Sciences */
    const demande = new URLSearchParams(location.search).get("theme");
    if (demande) {
        const chip = chips.find((c) => simple(c.dataset.theme) === simple(demande));
        if (chip) {
            chips.forEach((c) => c.classList.remove("is-on"));
            chip.classList.add("is-on");
            theme = chip.dataset.theme;
        }
    }

    filtrer();
})();
