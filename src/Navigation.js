import React from "react";
import { NavLink } from "react-router-dom";

const Navigation = () => {

    return (
        <div className="navigation">
            <div className="linkcontainer">
                <NavLink to='/'>Recherche de liens</NavLink>
                <NavLink to='/evaluate'>Evaluation comptes</NavLink>
                <NavLink to='/filter'>Evaluation contacts</NavLink>
                <NavLink to='/searchdistance'>Distance en masse</NavLink>
                <NavLink to='/distancecalculator'>Distance point par point</NavLink>
            </div>
        </div>
    )
} 

export default Navigation;