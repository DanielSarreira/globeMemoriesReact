import React, { useState, useEffect } from 'react';

import { request, setAuthHeader } from '../axios_helper';


const AuthContent = () => {

    // Initialize state
    const [data, setData] = useState([]);

    // ComponentDidMount equivalent using useEffect
    useEffect(() => {
        request("GET", "/messages", {})
        .then((response) => {
            setData(response.data); // Update state with the response data
        })
        .catch((error) => {
            if (error.response && error.response.status === 401) {
            setAuthHeader(null);
            } else {
            setData(error.response ? error.response.code : "Unknown Error");
            }
        });
    }, []); // Empty dependency array ensures this runs only once when the component mounts

    return (
        <div className="row justify-content-md-center">
          <div className="col-4">
            <div className="card" style={{ width: "18rem" }}>
              <div className="card-body">
                <h5 className="card-title">Backend Response</h5>
                <p className="card-text">Content:</p>
                <ul>
                    <h1>Data</h1>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    };

export default AuthContent;