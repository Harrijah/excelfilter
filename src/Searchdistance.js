import React, { useState } from "react";
import axios from 'axios';
import * as XLSX from "xlsx";
import Navigation from './Navigation';

const Searchdistance = () => {
    // ----------- Variables d'état
    const [excelData, setExcelData] = useState([]);
    const [listeDeHeaders, setListeDeHeaders] = useState([]);
    const [departAdresse, setDepartAdresse] = useState(""); // Adresse manuelle
    const [adresseColonne1, setAdresseColonne1] = useState(""); // Colonne 1 pour adresse
    const [adresseColonne2, setAdresseColonne2] = useState(""); // Colonne 2 pour adresse
    const [loading, setLoading] = useState(false);

    // ----------- Fonction pour charger le fichier Excel
    const handleFileUpload = (event) => {
        const fichierExcel = event.target.files[0];
        const lecteurDeFichier = new FileReader();
        
        lecteurDeFichier.onload = (e) => {
            const classeurExcel = new Uint8Array(e.target.result);
            const donneesBrutes = XLSX.read(classeurExcel, { type: 'array' });
            const feuilleALire = donneesBrutes.SheetNames[0];
            const feuilleATraiterIci = donneesBrutes.Sheets[feuilleALire];
            const jsonData = XLSX.utils.sheet_to_json(feuilleATraiterIci, { defval: "" });
            setExcelData(jsonData);

            // Récupérer les en-têtes des colonnes
            const nonEmptyRow = jsonData.find(row => Object.values(row).some(cell => cell !== ''));
            const tempHeaderList = nonEmptyRow ? Object.keys(nonEmptyRow) : [];
            setListeDeHeaders(tempHeaderList);
        }
        lecteurDeFichier.readAsArrayBuffer(fichierExcel);
    };

    // ----------- Fonction pour calculer la distance
    // const calculateDistances = async () => {
    //     if (!departAdresse || !adresseColonne1) {
    //         alert("Veuillez entrer une adresse de départ et sélectionner les colonnes d'adresse.");
    //         return;
    //     }

    //     setLoading(true);
    //     const results = await Promise.all(
    //         excelData.map(async (ligne) => {
    //             // Construction de l’adresse pour chaque ligne
    //             const adresseLigne = `${ligne[adresseColonne1]} ${adresseColonne2 ? ligne[adresseColonne2] : ""}`;

    //             try {
    //                 const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
    //                     params: {
    //                         origins: departAdresse,
    //                         destinations: adresseLigne,
    //                         key: GOOGLE_API_KEY,
    //                         mode: 'driving'
    //                     }
    //                 });

    //                 const duration = response.data.rows[0].elements[0].duration?.text || "N/A";
    //                 return { ...ligne, "Distance (min)": duration };
    //             } catch (error) {
    //                 console.error("Erreur lors de la requête de calcul de distance :", error);
    //                 return { ...ligne, "Distance (min)": "Erreur" };
    //             }
    //         })
    //     );

    //     setLoading(false);
    //     setExcelData(results);

    
    // };
    
    // ----------- Fonction pour calculer la distance
    
    // Fonction pour calculer la distance avec un délai entre chaque requête
    const calculateDistances = async () => {
        if (!departAdresse || !adresseColonne1) {
            alert("Veuillez entrer une adresse de départ et sélectionner les colonnes d'adresse.");
            return;
        }
    
        setLoading(true);
        const results = [];
        let delay = 0; // Initialisation du délai
    
        for (let i = 0; i < excelData.length; i++) {
            const ligne = excelData[i];
            const adresseLigne = `${ligne[adresseColonne1]} ${adresseColonne2 ? ligne[adresseColonne2] : ""}`;
    
            // Fonction auto-exécutante pour gérer le contexte `i`
            (
                async (index) => {
                    // setTimeout(async () => {
                    //     try {
                    //         // Construire l'URL vers le contrôleur PHP
                    //         const url = `https://api.axel.mg/getduration?origins=${encodeURIComponent(departAdresse)}&destinations=${encodeURIComponent(adresseLigne)}`;
                            
                    //         const response = await fetch(url, {
                    //             method: "GET"
                    //         });
    
                    //         if (!response.ok) {
                    //             throw new Error(`Erreur HTTP! Statut: ${response.status}`);
                    //         }
    
                    //         const data = await response.json();
                    //         const duration = data.rows[0].elements[0].duration?.text || "N/A";
                    //         results[index] = { ...ligne, "Distance (min)": duration };
                    //     } catch (error) {
                    //         console.error("Erreur lors de la requête de calcul de distance :", error);
                    //         results[index] = { ...ligne, "Distance (min)": "Erreur" };
                    //     }
    
                    //     // Mettre à jour l'état avec les résultats après le dernier élément
                    //     if (index === excelData.length - 1) {
                    //         setExcelData(results);
                    //         setLoading(false);
                    //     }
                    // }, delay);

                    setTimeout(async () => {
                        try {
                            // Construire l'URL vers le contrôleur PHP
                            const url = `https://api.axel.mg/getduration?origins=${encodeURIComponent(departAdresse)}&destinations=${encodeURIComponent(adresseLigne)}`;
                            // const url = `http://localhost:8080/getDuration?origins=${encodeURIComponent(departAdresse)}&destinations=${encodeURIComponent(adresseLigne)}`;
                            
                            const response = await fetch(url, {
                                method: "GET"
                            });
                    
                            if (!response.ok) {
                                throw new Error(`Erreur HTTP! Statut: ${response.status}`);
                            }
                    
                            const data = await response.json();
                            let duration = data.rows[0].elements[0].duration?.text || "N/A";
                    
                            // Vérifier et traiter la durée
                            // if (duration.includes("hour") || parseInt(duration) > 35) {
                            //     duration = "hors cible";
                            // }
                    
                            results[index] = { ...ligne, "Distance (min)": duration };
                        } catch (error) {
                            console.error("Erreur lors de la requête de calcul de distance :", error);
                            results[index] = { ...ligne, "Distance (min)": "Erreur" };
                        }
                    
                        // Mettre à jour l'état avec les résultats après le dernier élément
                        if (index === excelData.length - 1) {
                            setExcelData(results);
                            setLoading(false);
                        }
                    }, delay);
                    
    
                    // Incrémenter le délai pour la prochaine requête
                    delay += 500; // Par exemple, 1 seconde entre chaque requête
                }
            )(i);
        }
    };
    




    // ----------- Fonction pour exporter le fichier Excel avec distances
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats");
        XLSX.writeFile(workbook, "Distances_Calculées.xlsx");
    };

    return (
        <div className="container">
            <Navigation />
            <div className="app">
                <h1>Calcul de distances</h1>
                
                <div className="controls">
                    {/* Input pour fichier Excel */}
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

                    {/* Input pour l'adresse de départ */}
                    <input
                        type="text"
                        value={departAdresse}
                        onChange={(e) => setDepartAdresse(e.target.value)}
                        placeholder="Entrez l'adresse de départ"
                        className="text-input"
                    />

                    {/* Sélecteurs de colonnes pour l'adresse */}
                    <select
                        value={adresseColonne1}
                        onChange={(e) => setAdresseColonne1(e.target.value)}
                        className="select-input"
                    >
                        <option value="">Sélectionnez la colonne de rue</option>
                        {listeDeHeaders.map((header, index) => (
                            <option key={index} value={header}>
                                {header}
                            </option>
                        ))}
                    </select>

                    <select
                        value={adresseColonne2}
                        onChange={(e) => setAdresseColonne2(e.target.value)}
                        className="select-input"
                    >
                        <option value="">Sélectionnez la colonne de code postal (optionnel)</option>
                        {listeDeHeaders.map((header, index) => (
                            <option key={index} value={header}>
                                {header}
                            </option>
                        ))}
                    </select>

                    <button onClick={calculateDistances} className="button">
                        {loading ? "Calcul en cours..." : "Calculer les distances"}
                    </button>
                    <button onClick={exportToExcel} className="button">
                        Exporter vers Excel
                    </button>
                </div>

                {/* Tableau des résultats */}
                <div className="montableau">
                    <h2>Résultats de recherche</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                {listeDeHeaders.map((head, index) => (
                                    <th key={index}>{head}</th>
                                ))}
                                <th>Distance (min)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {excelData.map((ligne, index) => (
                                <tr key={index}>
                                    {listeDeHeaders.map((head, idx) => (
                                        <td key={idx}>{ligne[head]}</td>
                                    ))}
                                    <td>{ligne["Distance (min)"] || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Searchdistance;