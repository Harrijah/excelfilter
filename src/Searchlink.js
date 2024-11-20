import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Navigation from "./Navigation";

const Searchlink = () => {
  const [excelData, setExcelData] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [accountColumn, setAccountColumn] = useState("");
  const [activityColumn, setActivityColumn] = useState("");

  const API_KEY = process.env.MY_API_KEY01;
  const CX = "023792d341da34d5d";

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      setExcelData(jsonData);
      setColumns(Object.keys(jsonData[0] || {})); // Définir les colonnes disponibles
    };

    reader.readAsArrayBuffer(file);
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const performSearch = async () => {
    setLoading(true);
    const searchResults = [];

    for (let i = 0; i < excelData.length; i++) {
      const searchQuery = `${excelData[i][accountColumn]} ${excelData[i][activityColumn]}`;

      try {
        const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
          params: {
            key: API_KEY,
            cx: CX,
            q: searchQuery,
            lr: "lang_fr",
            gl: 'ch',
          },
        });

        const urls = response.data.items
          ? response.data.items.slice(0, 2).map(item => item.link)
          : ["Aucun site trouvé", "Aucun site trouvé"];
        
        excelData[i]["site web 1"] = urls[0];
        excelData[i]["site web 2"] = urls[1];
        
        searchResults.push({ query: searchQuery, urls });

      } catch (error) {
        console.error("Erreur lors de la recherche :", error);
        excelData[i]["site web 1"] = "Erreur lors de la recherche";
        excelData[i]["site web 2"] = "Erreur lors de la recherche";
      }

      await delay(200);
    }

    setResults(searchResults);
    setLoading(false);

    exportToExcel(excelData);
  };

  const exportToExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats");
    XLSX.writeFile(workbook, "Recherche_Google_Resultats.xlsx");
  };

  return (
    <div className="container">
      <Navigation />
      <div className="app">
        <h1>Recherche de liens</h1>

        <div className="controls">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="file-input" />

          {columns.length > 0 && (
            <div className="select-fields">
              <label>
                Nom du compte:
                <select value={accountColumn} onChange={(e) => setAccountColumn(e.target.value)}>
                  <option value="">Sélectionner une colonne</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </label>
              <label>
                Type d'activité:
                <select value={activityColumn} onChange={(e) => setActivityColumn(e.target.value)}>
                  <option value="">Sélectionner une colonne</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <button onClick={performSearch} disabled={loading || !excelData.length || !accountColumn || !activityColumn} className="button">
            {loading ? "Recherche en cours..." : "Lancer la recherche"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="montableau">
            <h2>Résultats de recherche</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recherche</th>
                  <th>URL 1</th>
                  <th>URL 2</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td>{result.query}</td>
                    {result.urls.map((url, idx) => (
                      <td key={idx}>
                        {url.startsWith("http") ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            {url}
                          </a>
                        ) : (
                          url
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Searchlink;
