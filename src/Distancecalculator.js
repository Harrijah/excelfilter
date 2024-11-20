import React, { useState } from "react";
import * as XLSX from "xlsx";
import Navigation from './Navigation';

const DistanceCalculator = () => {
    // Variables d'état
    const [nomDepart, setNomDepart] = useState("");
    const [adresseDepart, setAdresseDepart] = useState("");
    const [nomArrivee, setNomArrivee] = useState("");
    const [adresseArrivee, setAdresseArrivee] = useState("");
    const [results, setResults] = useState([]); // Tableau pour stocker les résultats
    const [loading, setLoading] = useState(false);

    // Fonction pour calculer la durée entre l'adresse de départ et l'adresse d'arrivée
    const calculateDuration = async () => {
        if (!adresseDepart || !adresseArrivee) {
            alert("Veuillez entrer les adresses de départ et d'arrivée.");
            return;
        }

        setLoading(true);

        try {
            // Construire l'URL de la requête
            const url = `https://api.axel.mg/getduration?origins=${encodeURIComponent(adresseDepart)}&destinations=${encodeURIComponent(adresseArrivee)}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erreur HTTP! Statut: ${response.status}`);

            const data = await response.json();
            const duration = data.rows[0].elements[0].duration?.text || "N/A";

            // Ajouter le résultat dans le tableau et vider les champs
            setResults(prevResults => [
                ...prevResults, 
                {
                    nomDepart,
                    adresseDepart,
                    nomArrivee,
                    adresseArrivee,
                    duree: duration
                }
            ]);

            // Réinitialiser les inputs après ajout
            setNomDepart("");
            setAdresseDepart("");
            setNomArrivee("");
            setAdresseArrivee("");
        } catch (error) {
            console.error("Erreur lors de la requête de calcul de durée :", error);
            setResults(prevResults => [
                ...prevResults,
                {
                    nomDepart,
                    adresseDepart,
                    nomArrivee,
                    adresseArrivee,
                    duree: "Erreur"
                }
            ]);

            // Réinitialiser les inputs même en cas d'erreur
            setNomDepart("");
            setAdresseDepart("");
            setNomArrivee("");
            setAdresseArrivee("");
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour exporter les résultats en Excel
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(results);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Durées");
        XLSX.writeFile(workbook, "Durées_Calculées.xlsx");
    };

    return (
        <div className="container">
            <Navigation />
            <div className="app">
                <h1>Calcul de Durées entre Adresses</h1>
                
                <div className="controls">
                    <input
                        type="text"
                        value={nomDepart}
                        onChange={(e) => setNomDepart(e.target.value)}
                        placeholder="Nom du lieu de départ"
                        className="text-input"
                    />

                    <input
                        type="text"
                        value={adresseDepart}
                        onChange={(e) => setAdresseDepart(e.target.value)}
                        placeholder="Adresse de départ"
                        className="text-input"
                    />

                    <input
                        type="text"
                        value={nomArrivee}
                        onChange={(e) => setNomArrivee(e.target.value)}
                        placeholder="Nom du lieu d'arrivée"
                        className="text-input"
                    />

                    <input
                        type="text"
                        value={adresseArrivee}
                        onChange={(e) => setAdresseArrivee(e.target.value)}
                        placeholder="Adresse d'arrivée"
                        className="text-input"
                    />

                    <button onClick={calculateDuration} className="button" disabled={loading}>
                        {loading ? "Calcul en cours..." : "Calculer la durée"}
                    </button>

                    <button onClick={exportToExcel} className="button">Exporter vers Excel</button>
                </div>

                <div className="montableau">
                    <h2>Résultats de recherche</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nom de l'endroit de départ</th>
                                <th>Adresse de départ</th>
                                <th>Nom de l'endroit d'arrivée</th>
                                <th>Adresse d'arrivée</th>
                                <th>Durée (min)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <tr key={index}>
                                    <td>{result.nomDepart}</td>
                                    <td>{result.adresseDepart}</td>
                                    <td>{result.nomArrivee}</td>
                                    <td>{result.adresseArrivee}</td>
                                    <td>{result.duree}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DistanceCalculator;
