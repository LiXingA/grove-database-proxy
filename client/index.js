import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './components/HomePage';
import Loading from "./components/Loading.jsx"
import Common from "./utils/Common";

let root_node = document.getElementById("root");
ReactDOM.render(<div>
    <HomePage />
    <Loading ></Loading>
    
</div>, root_node);