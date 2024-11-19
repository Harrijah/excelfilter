import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Navigation from "./Navigation";

function Evaluate() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phonePrefix02, setPhonePrefix02] = useState("");
  const [emailDomains, setEmailDomains] = useState(["", "", "", ""]);
  const [websiteDomains, setWebsiteDomains] = useState(["", "", "", ""]);
  const [capacityKeyword, setCapacityKeyword] = useState("");
  const [threshold1, setThreshold1] = useState(0);
  const [threshold2, setThreshold2] = useState(0);
  const [threshold3, setThreshold3] = useState(0);
  const [keywords, setKeywords] = useState(Array(10).fill("")); // 10 champs pour les mots-clés
  const [loading, setLoading] = useState(false);

  const API_KEY = "AIzaSyCGCcE2Xk-MhhaV9-hb8KoexuZoEupGo1I";
  const CX = "80079e6aaa2014fb8";

   // Fonction pour lire le fichier Excel
   const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }); // Conserve les colonnes vides
      setData(jsonData);

      // Extraire les en-têtes dynamiquement
      const columnHeaders = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      setHeaders(columnHeaders);
      setProcessedData(jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

  // Fonction d'évaluation pour chaque ligne
  const evaluateRow = useCallback(
    (row) => {
      let score = 0;

      // Vérification si le téléphone existe
      if (!row["Téléphone"] || row["Téléphone"].trim() === "") {
        return "Pas de téléphone";
      }

      // Critère Téléphone : pénaliser si le préfixe correspond
      if (phonePrefix && row["Téléphone"].startsWith(phonePrefix)) {
        score -= 1;
      }
      if (phonePrefix02 && row["Téléphone"].startsWith(phonePrefix02)) {
        score -= 1;
      }

      // Critère Adresse e-mail : ajouter 1 point si une adresse e-mail est présente et vérifier les domaines exclus
      if (row["Adresse e-mail"]) {
        score += 1;
        if (
          emailDomains.some(
            (domain) => domain && row["Adresse e-mail"].includes(domain)
          )
        ) {
          score -= 1;
        }
      }

      // Critère Site Web : ajouter 1 point si un site web est présent et vérifier les domaines exclus
      if (row["Site Web"]) {
        score += 1;
        if (
          websiteDomains.some((domain) => domain && row["Site Web"].includes(domain))
        ) {
          score -= 1;
        }
      }

      // Critère LinkedIn
      if (row["LinkedIn"]) {
        score += 1;
      }

      // Critère Description pour la capacité avec les seuils
      const capacityMatch = row["Description"]?.match(
        new RegExp(`${capacityKeyword} : (\\d+)`)
      );
      if (capacityMatch) {
        const capacityValue = parseInt(capacityMatch[1]);
        if (capacityValue > threshold3) {
          score += 3;
        } else if (capacityValue > threshold2) {
          score += 2;
        } else if (capacityValue > threshold1) {
          score += 1;
        }
      }

      // Critère Nom du contact : ajouter 5 points si un nom de contact est présent
      if (row["Nom du contact"] && row["Nom du contact"] !== "-") {
        score += 1;
      }

      return score;
    },
    [phonePrefix, phonePrefix02, emailDomains, websiteDomains, capacityKeyword, threshold1, threshold2, threshold3]
  );

 
  // Fonction pour analyser chaque URL dans le fichier Excel
    const analyzeUrls = async () => {
      setLoading(true);
      const results = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const siteUrl = row["Site Web"];
        let rowScore = evaluateRow(row); // Calculez le score initial sans les mots-clés
        const rowResults = { ...row };

        // Vérifiez s'il y a au moins un mot-clé de renseigné
        if (keywords.some((k) => k)) {
          for (let j = 0; j < keywords.length; j++) {
            const keyword = keywords[j];
            if (!keyword) continue;

            const searchQuery = `site:${siteUrl}`;
            const searchQuery02 = `${keyword}`;

            // Ajouter un délai de 100ms avant chaque requête
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
              const response = await axios.get(
                "https://www.googleapis.com/customsearch/v1",
                {
                  params: {
                    key: API_KEY,
                    cx: CX,
                    q: searchQuery,
                    hq: searchQuery02,
                    lr: "lang_fr",
                  },
                }
              );

              const found = response.data.items && response.data.items.length > 0;
              const pageLink = found ? response.data.items[0].link : "Non trouvé";

              rowResults[keyword] = pageLink; // Utilise le mot-clé comme nom de la colonne
              if (found) rowScore += 5; // Ajouter 5 points si le mot-clé est trouvé
            } catch (error) {
              console.error(`Erreur lors de la recherche pour le mot-clé ${j + 1} :`, error);
              rowResults[keyword] = "Erreur";
            }
          }
        }

        rowResults["Evaluation"] = rowScore;
        results.push(rowResults);
      }

      setProcessedData(results);
      setSearchResults(results);
      setLoading(false);
    };



  // Export des données traitées en Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "ProcessedData.xlsx");
  };

return (
    <div className="container">
        <Navigation />
        <div className="app">
            <h1>Evaluation comptes Salesforce</h1>

            <div className="controls">
                <input type="file" onChange={handleFileUpload} className="file-input" />
                <button onClick={analyzeUrls} disabled={loading || !data.length}>
                {loading ? "Analyse en cours..." : "Lancer l'analyse"}
                </button>
                <button onClick={exportToExcel} className="button">
                Exporter vers Excel
                </button>
            </div>

            <div className="filters">
                <h2>Critères d'évaluation</h2>

                <div className="filter-row single">
                <label>Préfixe Téléphone mobile :</label>
                <input
                    type="text"
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                />
                </div>
                <div className="filter-row single">
                <label>Préfixe Téléphone mobile 02:</label>
                <input
                    type="text"
                    value={phonePrefix02}
                    onChange={(e) => setPhonePrefix02(e.target.value)}
                />
                </div>

                <div className="filter-row multiple">
                <label>Emails dépréciés :</label>
                {emailDomains.map((domain, index) => (
                    <input
                    key={index}
                    type="text"
                    value={domain}
                    placeholder="ex : gmail.com"
                    onChange={(e) => {
                        const newDomains = [...emailDomains];
                        newDomains[index] = e.target.value;
                        setEmailDomains(newDomains);
                    }}
                    />
                ))}
                </div>

                <div className="filter-row multiple">
                <label>Sites Web dépréciés :</label>
                {websiteDomains.map((domain, index) => (
                    <input
                    key={index}
                    type="text"
                    value={domain}
                    placeholder="ex : accor.com"
                    onChange={(e) => {
                        const newDomains = [...websiteDomains];
                        newDomains[index] = e.target.value;
                        setWebsiteDomains(newDomains);
                    }}
                    />
                ))}
                </div>

                <div className="filter-row single">
                <label>Description à évaluer :</label>
                <input
                    type="text"
                    value={capacityKeyword}
                    placeholder="ex: Capacité d'hébergement"
                    onChange={(e) => setCapacityKeyword(e.target.value)}
                />
                </div>

                <div className="filter-row single">
                <label>Supérieure à :</label>
                <input
                    type="number"
                    value={threshold1}
                    onChange={(e) => setThreshold1(Number(e.target.value))}
                />
                </div>
                <div className="filter-row single">
                <label>Supérieure à :</label>
                <input
                    type="number"
                    value={threshold2}
                    onChange={(e) => setThreshold2(Number(e.target.value))}
                />
                </div>
                <div className="filter-row single">
                <label>Supérieure à :</label>
                <input
                    type="number"
                    value={threshold3}
                    onChange={(e) => setThreshold3(Number(e.target.value))}
                />
                </div>

                <h2>Mots-Clés à rechercher sur le site web</h2>
                <div>
                {keywords.map((keyword, index) => (
                    <input
                    key={index}
                    type="text"
                    placeholder={`Mot-clé ${index + 1}`}
                    value={keyword}
                    onChange={(e) => {
                        const newKeywords = [...keywords];
                        newKeywords[index] = e.target.value;
                        setKeywords(newKeywords);
                    }}
                    />
                ))}
                </div>
            </div>
            <div className="montableau">
              <table className="data-table">
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                    <th>Évaluation</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex}>{row[header]}</td>
                      ))}
                      <td>{row["Evaluation"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
    </div>
  );
}

export default Evaluate;
