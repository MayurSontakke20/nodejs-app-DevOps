import React, { useReducer, useState } from 'react';




function Calculator() {
    const [num1, setnum1] = useState("");
    const [num2, setnum2] = useState("");
    const [finalOutput, setFinalOutput] = useState(0);

    const reducer = (state, action) => {

        if (action.type === "A") {
            return state = setFinalOutput(Number(action.value1) + Number(action.value2));
        }
        if (action.type === "S") {
            if (Number(action.value2) < Number(action.value1)) {
                alert("Second value should be greater than first one");
                return state = "Value Error";
            }
            return state = setFinalOutput(Number(action.value2) - Number(action.value1));
        }
        if (action.type === "M") {
            return state = setFinalOutput(Number(action.value1) * Number(action.value2));
        }
        if (action.type === "D") {
            if (Number(action.value2) == 0) {
                alert("Second value cannot be zero");
                return state = "Divide by Zero Error";

            }
            return state = setFinalOutput(Number(action.value1) / Number(action.value2));
        }
        return state;
    }

    function clear() {
        setnum1("");
        setnum2("");
        setFinalOutput(0);
        // document.getElementById("num1").value = "";
        // document.getElementById("num2").value = "";
        // document.getElementById("output").innerHTML = "0";
    }

    const [state, dispatch] = useReducer(reducer, finalOutput);


    return (
        <div className="calci">
            <div className="section">
                <input type="number" value={num1} onChange={(e) => setnum1(e.target.value)} />
                <input type="number" value={num2} onChange={(e) => setnum2(e.target.value)} />
                <h3>Output : {finalOutput}</h3>
                <button onClick={() => clear()}>Clear</button>
                <button onClick={() => dispatch({ type: "A", value1: num1, value2: num2 })}>Add</button>
                <button onClick={() => dispatch({ type: "S", value1: num1, value2: num2 })}>Subtract</button>
                <button onClick={() => dispatch({ type: "M", value1: num1, value2: num2 })}>Multiply</button>
                <button onClick={() => dispatch({ type: "D", value1: num1, value2: num2 })}>Divide</button>
            </div>
        </div>
    );
}

export default Calculator;
