import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Navigation from "./Navigation";
import "./App.css";

function Filter() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [filters, setFilters] = useState([{ selectedColumn: "", operator: "includes", searchValue: "" }]);
  const [processedData, setProcessedData] = useState([]);

  // Fonction pour charger le fichier Excel et récupérer les données
  // Fonction pour charger le fichier Excel et récupérer les données
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Filtrer pour ignorer les lignes vides et déterminer les en-têtes
        const firstNonEmptyRow = jsonData.find(row => Object.values(row).some(cell => cell != ""));
        const columnHeaders = firstNonEmptyRow ? Object.keys(firstNonEmptyRow) : [];

        setHeaders(columnHeaders);
        setData(jsonData);
        setProcessedData(jsonData);
        };

        reader.readAsArrayBuffer(file);
    };
  

  // Fonction pour ajouter un filtre
  const addFilter = () => {
    setFilters([...filters, { selectedColumn: "", operator: "includes", searchValue: "" }]);
  };

  // Fonction pour gérer le changement d'un filtre
  const handleFilterChange = (index, field, value) => {
    const newFilters = filters.map((filter, i) =>
      i === index ? { ...filter, [field]: value } : filter
    );
    setFilters(newFilters);
  };

  // Fonction pour supprimer un filtre
  const removeFilter = (index) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
  };

  // Fonction pour appliquer le système de scoring et les exclusions
  const applyFilters = () => {
    const result = data.map((row) => {
      let score = 0;

      // Appliquer chaque filtre pour vérifier les conditions
      const shouldExcludeRow = filters.some((filter) => {
        const cellValue = row[filter.selectedColumn];

        switch (filter.operator) {
          case "includes":
            if (cellValue?.toString().includes(filter.searchValue)) {
              score += 5; // Ajoute 5 points si le terme est trouvé
            }
            break;
          case "greaterThan":
            if (parseFloat(cellValue) > parseFloat(filter.searchValue)) {
              score += 5; // Ajoute 5 points si la valeur est supérieure
            }
            break;
          case "excludes":
            return cellValue?.toString().includes(filter.searchValue); // Exclut la ligne si le terme est présent
          default:
            return false;
        }
        return false;
      });

      if (!shouldExcludeRow) {
        return { ...row, Evaluation: score };
      }
      return null; // Exclure la ligne si elle contient des termes non souhaités
    });

    setProcessedData(result.filter((row) => row !== null));
  };

  // Fonction pour exporter les données en Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "FilteredData.xlsx");
  };

  return (
    <div className="container">
        <Navigation />
        <div className="app">
        <h1>Evaluation données brutes</h1>
        <div className="controls" style={{padding: '50px'}}>
            <input type="file" onChange={handleFileUpload} className="file-input" />
            <button onClick={addFilter} className="button">
            Ajouter un filtre
            </button>
            <button onClick={applyFilters} className="button" style={{backgroundColor: 'orange'}}>
            Appliquer les filtres
            </button>
            <button onClick={exportToExcel} className="button" style={{backgroundColor: 'yellowgreen'}}>
            Exporter vers Excel
            </button>
        </div>

        <div className="filters" style={{padding: '50px'}}>
            {filters.map((filter, index) => (
            <div key={index} className="filter-row">
                <select
                value={filter.selectedColumn}
                onChange={(e) => handleFilterChange(index, "selectedColumn", e.target.value)}
                className="select-input"
                >
                <option value="">Sélectionnez une colonne</option>
                {headers.map((header, i) => (
                    <option key={i} value={header}>
                    {header}
                    </option>
                ))}
                </select>

                <select
                value={filter.operator}
                onChange={(e) => handleFilterChange(index, "operator", e.target.value)}
                className="operator-select"
                >
                <option value="includes">Contient</option>
                <option value="excludes">Ne contient pas</option>
                <option value="greaterThan">Supérieur à</option>
                </select>

                <input
                type="text"
                value={filter.searchValue}
                onChange={(e) => handleFilterChange(index, "searchValue", e.target.value)}
                placeholder="Entrez une valeur"
                className="text-input"
                />

                <button onClick={() => removeFilter(index)} className="remove-filter-button">
                Supprimer
                </button>
            </div>
            ))}
        </div>

        </div>  
    </div>
  );
}

export default Filter;
