/**
 * galerie.js
 * Vue principale : grille d'œuvres avec filtres et recherche.
 * Appelée par router.js via afficherGalerie(APP).
 */

function afficherGalerie(app) {
  const conteneur = document.getElementById("app");

  // ─── Variable mode d'affichage ───────────────────────────────────────────────
  let modeAffichage = "grille";

  // ─── Construction des filtres ───────────────────────────────────────────────
  const techniques = [...new Set(
  app.oeuvre_techniques.map(r => r.libelle)
)].sort();

  const supports = [...new Set(
    app.oeuvres.map(o => o.support?.libelle).filter(Boolean)
  )].sort();

  const types = [...new Set(
    app.oeuvres.map(o => o.type_oeuvre).filter(Boolean)
  )].sort();


  // Thèmes regroupés par catégorie

  const themeIdsUtilises = new Set(app.oeuvre_themes.map(r => r.theme_id));

  const themesParCategorie = {};
  app.themes
    .filter(t => themeIdsUtilises.has(t.id))  // ← filtre ici
    .forEach(t => {
      if (!themesParCategorie[t.categorie]) themesParCategorie[t.categorie] = [];
      themesParCategorie[t.categorie].push(t);
    });

  function blocFiltre(titre, items, attr) {
    return `
      <fieldset class="filtre-groupe">
        <legend>${titre}</legend>
        ${items.map(v => `
          <label class="filtre-item">
          <input type="checkbox" data-attr="${attr}" data-val="${v}">
          <span class="filtre-label">
            ${v}
          </span>
          <span class="filtre-compteur">
            0
          </span>
        </label>
        `).join("")}
      </fieldset>`;
  }

  const filtreThemes = Object.entries(themesParCategorie).map(([cat, items]) => `
  <fieldset class="filtre-groupe">
    <legend>${cat}</legend>
    ${items.map(t => `
      <label class="filtre-item">
        <input
          type="checkbox"
          data-attr="theme"
          data-val="${t.id}"
        >

        <span class="filtre-label">
          ${t.libelle}
        </span>

        <span class="filtre-compteur">
          0
        </span>
      </label>
    `).join("")}
  </fieldset>
`).join("");

  

  // ─── HTML de la page ────────────────────────────────────────────────────────
  conteneur.innerHTML = `
    <div class="layout">
      <aside class="filtres">
        <div class="filtres-header">
          <h2>FILTRES</h2>
          <button id="reset-filtres">réinitialiser</button>
        </div>
        ${blocFiltre("Type d'œuvre", types, "type_oeuvre")}
        <fieldset class="filtre-groupe">
          <legend>Année</legend>
          <div class="filtre-annee">
            <input type="number" id="annee-min" placeholder="de">
            <span>—</span>
            <input type="number" id="annee-max" placeholder="à">
          </div>
        </fieldset>
        ${blocFiltre("Technique", techniques, "technique")}
        ${blocFiltre("Support", supports, "support")}
        ${filtreThemes}
      </aside>
      <main>
        <div class="barre-affichage">
          <p id="compteur" class="compteur"></p>
          <div class="toggle-affichage" id="toggle-affichage">
            <button id="btn-grille" class="toggle-btn actif">Grille</button>
            <button id="btn-chronologie" class="toggle-btn">Chronologie</button>
          </div>
        </div>
        <div id="grille" class="galerie-oeuvres"></div>
      </main>
    </div>
  `;

// ─── Écouteurs toggle Grille / Chronologie ───────────────────────────────────
document.getElementById("btn-grille").addEventListener("click", () => {
    modeAffichage = "grille";
    document.getElementById("btn-grille").classList.add("actif");
    document.getElementById("btn-chronologie").classList.remove("actif");
    appliquerFiltres();
});

document.getElementById("btn-chronologie").addEventListener("click", () => {
    modeAffichage = "chronologie";
    document.getElementById("btn-chronologie").classList.add("actif");
    document.getElementById("btn-grille").classList.remove("actif");
    appliquerFiltres();
});
// ─── Filtres repliables ─────────────────────────────────────────────────────

// Tous fermés sauf le premier
document.querySelectorAll(".filtre-groupe")
  .forEach((groupe, i) => {
    if (i > 0) {
      groupe.classList.add("ferme");
    }
  });

// Clic sur le titre
document.querySelectorAll(".filtre-groupe legend")
  .forEach(legend => {

    legend.addEventListener("click", () => {
      legend.parentElement.classList.toggle("ferme");
    });

  });

appliquerFiltres();      
  // ─── Logique de filtrage ────────────────────────────────────────────────────
  function appliquerFiltres() {
    const cases = document.querySelectorAll('.filtres input[type="checkbox"]:checked');
    const filtresParAttr = {};
    cases.forEach(c => {
      const attr = c.dataset.attr;
      if (!filtresParAttr[attr]) filtresParAttr[attr] = [];
      filtresParAttr[attr].push(c.dataset.val);
    });

    const anneeMin = parseInt(document.getElementById("annee-min").value) || null;
    const anneeMax = parseInt(document.getElementById("annee-max").value) || null;
    const recherche = document.getElementById("recherche").value.trim().toLowerCase();

    const resultat = app.oeuvres.filter(o => {
      // Filtres à cases
      for (const attr in filtresParAttr) {
        const valeurs = filtresParAttr[attr];
        if (attr === "theme") {
          const themesOeuvre = app.oeuvre_themes
            .filter(r => r.oeuvre_id === o.id)
            .map(r => String(r.theme_id));
          if (!valeurs.some(v => themesOeuvre.includes(v))) return false;
        } else if (attr === "technique") {
          const techniquesOeuvre = app.oeuvre_techniques
            .filter(r => r.oeuvre_id === o.id)
            .map(r => r.libelle);

          if (!valeurs.some(v => techniquesOeuvre.includes(v))) {
            return false;
          }
        }
          else if (attr === "support") {
          if (!valeurs.includes(o.support?.libelle)) return false;
        } else if (attr === "type_oeuvre") {
          if (!valeurs.includes(o.type_oeuvre)) return false;
        }
      }

      // Filtre années
      if (anneeMin && o.annee < anneeMin) return false;
      if (anneeMax && o.annee > anneeMax) return false;

      // Recherche plein texte
      if (recherche) {
        const themesTexte = app.oeuvre_themes
          .filter(r => r.oeuvre_id === o.id)
          .map(r => app.themes.find(t => t.id === r.theme_id)?.libelle || "")
          .join(" ");
        const techniquesTexte = app.oeuvre_techniques
          .filter(r => r.oeuvre_id === o.id)
          .map(r => r.libelle)
          .join(" ");
        const champ = [
          o.titre, o.cote, o.description,
          themesTexte,
          techniquesTexte
        ].filter(Boolean).join(" ").toLowerCase();
        if (!champ.includes(recherche)) return false;
      }

      return true;
    });
    

    afficherCartes(resultat);

    /* Compteurs des items de filtre */
    const compteursTechniques = {};
    const compteursSupports = {};
    const compteursTypes = {};
    const compteursThemes = {};

    
    resultat.forEach(o => {

      if (o.type_oeuvre) {
        compteursTypes[o.type_oeuvre] =
          (compteursTypes[o.type_oeuvre] || 0) + 1;
      }

      if (o.support?.libelle) {
        compteursSupports[o.support.libelle] =
          (compteursSupports[o.support.libelle] || 0) + 1;
      }

      app.oeuvre_techniques
        .filter(r => r.oeuvre_id === o.id)
        .forEach(r => {
          compteursTechniques[r.libelle] =
            (compteursTechniques[r.libelle] || 0) + 1;
        });

      app.oeuvre_themes
        .filter(r => r.oeuvre_id === o.id)
        .forEach(r => {
          compteursThemes[String(r.theme_id)] =
            (compteursThemes[String(r.theme_id)] || 0) + 1;
        });

    });
    /* COMPTEURS DES TECHNIQUES */
    function mettreAJourCompteurs(attr, compteurs) {
      document
        .querySelectorAll(`input[data-attr="${attr}"]`)
        .forEach(input => {

          const nb =
            compteurs[input.dataset.val] || 0;

          input.parentElement
            .querySelector(".filtre-compteur")
            .textContent = `(${nb})`;
        });
    }
    mettreAJourCompteurs("technique", compteursTechniques);
    mettreAJourCompteurs("support", compteursSupports);
    mettreAJourCompteurs("type_oeuvre", compteursTypes);
    mettreAJourCompteurs("theme", compteursThemes);
  }
  
  // ─── Rendu d'une carte individuelle ─────────────────────────────────────────
  function carteHTML(o) {
    const img = o.image_principale
      ? `<img src="images/${o.image_principale}" alt="${o.titre}">`
      : "";
    return `
      <a class="carte" href="index.html?vue=oeuvre&id=${o.id}">
        ${img}
        <div class="carte-meta">
          <span class="carte-titre">${o.titre}</span>
          <span class="carte-annee">${o.annee || ""}</span>
        </div>
      </a>`;
  }

  // ─── Mode grille (masonry aléatoire) ────────────────────────────────────────
  function afficherGrille(liste) {
    const grille = document.getElementById("grille");
    grille.className = "galerie-oeuvres";
    const melange = [...liste].sort(() => Math.random() - 0.5);
    grille.innerHTML = melange.map(carteHTML).join("");
  }

  // ─── Mode chronologie (groupé par année) ────────────────────────────────────
  function afficherChronologie(liste) {
    const grille = document.getElementById("grille");
    grille.className = "galerie-chronologie";

    const parAnnee = {};
    liste.forEach(o => {
      const annee = o.annee || "Sans date";
      if (!parAnnee[annee]) parAnnee[annee] = [];
      parAnnee[annee].push(o);
    });

    const anneesTriees = Object.keys(parAnnee).sort((a, b) => {
      if (a === "Sans date") return 1;
      if (b === "Sans date") return -1;
      return b - a;
    });

    grille.innerHTML = anneesTriees.map(annee => `
      <div class="groupe-annee">
        <div class="separateur-annee">
          <span class="separateur-annee-label">${annee}</span>
        </div>
        <div class="galerie-oeuvres">
          ${parAnnee[annee].map(carteHTML).join("")}
        </div>
      </div>
    `).join("");
  }

  // ─── Dispatcher selon le mode actif ─────────────────────────────────────────
  function afficherCartes(liste) {
    const compteur = document.getElementById("compteur");
    const grille = document.getElementById("grille");
    compteur.textContent = `${liste.length} œuvre${liste.length !== 1 ? "s" : ""}`;

    if (liste.length === 0) {
      grille.className = "";
      grille.innerHTML = '<p class="vide">Aucune œuvre ne correspond.</p>';
      return;
    }

    if (modeAffichage === "chronologie") {
      afficherChronologie(liste);
    } else {
      afficherGrille(liste);
    }
  }

  // ─── Écouteurs ──────────────────────────────────────────────────────────────
  document.querySelectorAll('.filtres input[type="checkbox"]')
    .forEach(c => c.addEventListener("change", appliquerFiltres));

  document.getElementById("annee-min").addEventListener("input", appliquerFiltres);
  document.getElementById("annee-max").addEventListener("input", appliquerFiltres);
  document.getElementById("recherche").addEventListener("input", appliquerFiltres);

  document.getElementById("reset-filtres").addEventListener("click", () => {
    document.querySelectorAll('.filtres input[type="checkbox"]')
      .forEach(c => c.checked = false);
    document.getElementById("annee-min").value = "";
    document.getElementById("annee-max").value = "";
    document.getElementById("recherche").value = "";
    appliquerFiltres();
  });

  // ─── Pré-filtrage depuis l'URL (ex: ?technique=Huile) ──────────────────────
  const params = new URLSearchParams(window.location.search);
  params.forEach((valeur, attr) => {
    if (attr === "vue") return;
    const cible = document.querySelector(
      `.filtres input[data-attr="${attr}"][data-val="${valeur}"]`
    );
    if (cible) cible.checked = true;
  });

  appliquerFiltres();
}




