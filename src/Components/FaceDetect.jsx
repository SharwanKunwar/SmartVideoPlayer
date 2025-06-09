import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceDetect() {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Load face-api models
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // Make sure your models are here
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (error) {
        setErrorMessage("Failed to load face-api models");
        console.error(error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;

    // Start webcam
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => setErrorMessage("Camera access denied"));

    let animationFrameId;

    // Detection loop
    const detectFace = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === 4
      ) {
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );
        setFaceDetected(!!detection);
      }
      animationFrameId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => cancelAnimationFrame(animationFrameId);
  }, [modelsLoaded]);

  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <h2>Face Detection Test</h2>
      <video
        ref={videoRef}
        width="320"
        height="240"
        muted
        style={{ border: "1px solid black", borderRadius: "8px" }}
      />
      <p>
        {errorMessage
          ? errorMessage
          : faceDetected
          ? "Detected ✅"
          : "Not Detected ❌"}
      </p>
    </div>
  );
}
