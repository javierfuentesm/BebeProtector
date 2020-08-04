import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import useInterval from "./hooks/useInterval";
import GaugeChart from "react-gauge-chart";
import * as tmPose from "@teachablemachine/pose";
import { Button } from "./styles/Button";

let model, webcam, ctx;
const App = () => {
  const URL = "https://teachablemachine.withgoogle.com/models/mkRnTM-u-/";
  const canvasRef = useRef(null);
  const alarmRef = useRef(null);
  const [shouldClassify, setShouldClassify] = useState(false);
  const [gaugeData, setGaugeData] = useState([0.5, 0.5]);

  useEffect(() => {
    startVideo().then((r) => console.log("Camara is ready"));
    return () => {
      stopVideo();
    };
  }, []);

  useEffect(() => {
    if (gaugeData[0]?.toFixed(2) >= 0.65) {
      alarmRef.current.play();
    } else {
      alarmRef.current.pause();
    }
  }, [gaugeData]);

  const startVideo = async () => {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);

    // Convenience function to setup a webcam
    const size = 300;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    const canvas = canvasRef.current;
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
  };
  const stopVideo = (e) => {
    webcam.stop();
    canvasRef.current.srcObject = null;
  };

  useInterval(async () => {
    if (webcam && shouldClassify) {
      webcam.update(); // update the webcam frame
      await predict();
    }
  }, 10);

  const predict = async () => {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);
    setGaugeData(prediction.map((entry) => entry.probability));
    // finally draw the poses
    drawPose(pose);
  };

  const drawPose = (pose) => {
    if (webcam.canvas) {
      ctx.drawImage(webcam.canvas, 0, 0);
      // draw the keypoints and skeleton
      if (pose) {
        const minPartConfidence = 0.5;
        tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
      }
    }
  };
  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <span role="img" aria-label="baby">👶🏼</span>BebeProtector<span role="img" aria-label="biberon">🍼</span>
        </h1>

        <Button onClick={() => setShouldClassify(!shouldClassify)}>
          {shouldClassify ? "Dejar de monitorear" : "Empezar a Monitorear"}
        </Button>

        <canvas width="300" height="150" className="webcam" ref={canvasRef} />

        {gaugeData[0].toFixed(2) >= 0.65 ? (
          <h3>La posición podría ser peligrosa</h3>
        ) : (
          <h3>Todo parece estar bien</h3>
        )}

        <GaugeChart
          id="gauge-chart4"
          nrOfLevels={10}
          arcPadding={0.1}
          cornerRadius={5}
          percent={+gaugeData[0].toFixed(2)}
        />
        <audio ref={alarmRef} src="./alarm-loud.mp3" preload="auto" />
      </header>
    </div>
  );
};

export default App;
