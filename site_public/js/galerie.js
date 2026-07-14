/**
 * galerie.js
 * Vue principale : grille d'œuvres avec filtres et recherche.
 * Appelée par router.js via afficherGalerie(APP).
 */

function afficherGalerie(app) {
  const conteneur = document.getElementById("app");

  // ─── Construction des filtres ───────────────────────────────────────────────
  const techniques = [...new Set(
    app.oeuvres.map(o => o.technique?.libelle).filter(Boolean)
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
            <input type="checkbox" data-attr="${attr}" data-val="${v}"> ${v}
          </label>
        `).join("")}
      </fieldset>`;
  }

  const filtreThemes = Object.entries(themesParCategorie).map(([cat, items]) => `
    <fieldset class="filtre-groupe">
      <legend>${cat}</legend>
      ${items.map(t => `
        <label class="filtre-item">
          <input type="checkbox" data-attr="theme" data-val="${t.id}"> ${t.libelle}
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
          if (!valeurs.includes(o.technique?.libelle)) return false;
        } else if (attr === "support") {
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
        const champ = [
          o.titre, o.cote, o.description,
          themesTexte
        ].filter(Boolean).join(" ").toLowerCase();
        if (!champ.includes(recherche)) return false;
      }

      return true;
    });

    afficherCartes(resultat);
  }

  function afficherCartes(liste) {
    const grille = document.getElementById("grille");
    const compteur = document.getElementById("compteur");
    compteur.textContent = `${liste.length} œuvre${liste.length !== 1 ? "s" : ""}`;

    if (liste.length === 0) {
      grille.innerHTML = '<p class="vide">Aucune œuvre ne correspond.</p>';
      return;
    }

    grille.innerHTML = liste.map(o => {
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
    }).join("");
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

// ─── Filtres repliables ─────────────────────────────────────────────────────

// ─── Pré-filtrage depuis l'URL ─────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);

params.forEach((valeur, attr) => {
  if (attr === "vue") return;

  const cible = document.querySelector(
    `.filtres input[data-attr="${attr}"][data-val="${valeur}"]`
  );

  if (cible) cible.checked = true;
});



