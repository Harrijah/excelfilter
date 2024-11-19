import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Searchlink from "./Searchlink";
import Evaluate from "./Evaluate";
import Filter from "./Filter";
import Searchdistance from "./Searchdistance";
import DistanceCalculator from "./Distancecalculator";


const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Searchlink />} ></Route>
        <Route path='/evaluate' element={<Evaluate />}></Route>
        <Route path="/filter" element={<Filter />}></Route>
        <Route path='/searchdistance' element={<Searchdistance />}></Route>
        <Route path='/distancecalculator' element={<DistanceCalculator />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;