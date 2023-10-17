/// <reference lib="webworker" />

import { FlatTradeURLs } from "./app.constants";

console.warn('web service started it is external file ')


self.onmessage = function(e) {
  if (e.data.functionName === 'multiply') {
    const result = multiply(e.data.num1, e.data.num2);
    self.postMessage({ result: result });
  }
};

function multiply(a : number, b: number) {
  return a * b;
}
self.onmessage = function(e) {
  if (e.data.functionName === 'makeRequest') {
    const result = makeRequest(e.data.num1);
    self.postMessage({ result: result });
  }
};
function makeRequest(data : any) {
  console.log('make request params' , data)
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data
  };

  fetch(FlatTradeURLs.TIMEPRICESeries, requestOptions)
    .then(response => response.json())
    .then(data => {
      self.postMessage({ result: data });
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
   
    

  }



  // addEventListener('message', ({ data }) => {
//   const response = `worker response to ${data}`;
//   postMessage(response);

  
// },);
// function callAPI() {
//     console.log('here ram')
//     fetch('https://example.com/api-endpoint')
//       .then((response) => response.json())
//       .then((data) => {
//         postMessage(data);
//       })
//       .catch((error) => {
//         console.error('Error fetching data:', error);
//       });
//   }
  
  // setInterval(callAPI, 10000); // Every 10 seconds

  /// new function test 
  // app.worker.ts