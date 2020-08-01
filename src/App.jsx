import React, { useRef, useEffect,useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import ml5 from "ml5";
import useInterval from "./hooks/useInterval";

let classifier;

function App() {
  const videoRef = useRef(null);
  const [shouldClassify, setShouldClassify] = useState(false);
  const [gaugeData, setGaugeData] = useState([0.5, 0.5]);



  useEffect(() => {
    startVideo();

    return () => {
      stopVideo();
    };
  }, []);

  const startVideo =  () => {
    classifier = ml5.imageClassifier("./my-model/model.json", () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((stream) => {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          });
      }
    });
  };
  const stopVideo = (e) => {
    if (videoRef.current) {
      let stream = videoRef.current.srcObject;
      let tracks = stream.getTracks();

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        track.stop();
      }
    }

    videoRef.current.srcObject = null;
  };
  useInterval(() => {
    if (classifier && shouldClassify) {
      classifier.classify(videoRef.current, (error, results) => {
        if (error) {
          console.error(error);
          return;
        }
        results.sort((a, b) => b.label.localeCompare(a.label));
       console.log(results.sort((a, b) => b.label.localeCompare(a.label)))
        setGaugeData(results.map(entry => entry.confidence));
      });
    }
  }, 500);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <button onClick={() => setShouldClassify(!shouldClassify)}>
          {shouldClassify ? "Stop classifying" : "Start classifying"}
        </button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <video
          ref={videoRef}
          style={{ transform: "scale(-1, 1)" }}
          width="300"
          height="150"
        />
      </header>
    </div>
  );
}

export default App;
