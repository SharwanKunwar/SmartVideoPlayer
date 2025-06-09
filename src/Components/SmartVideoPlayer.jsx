// src/SmartVideoPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function SmartVideoPlayer() {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading models...");
  const [faceDetected, setFaceDetected] = useState(false);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setLoadingMessage("");
      } catch (error) {
        console.error("Error loading models:", error);
        setLoadingMessage("Failed to load face detection models.");
      }
    };
    loadModels();
  }, []);

  // Start webcam
  useEffect(() => {
    if (!modelsLoaded) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          setCameraAllowed(true);
          setLoadingMessage("");
        }
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
        setLoadingMessage("Camera access denied. Please allow camera to continue.");
        setCameraAllowed(false);
      });
  }, [modelsLoaded]);

  // Simple face detection loop (no eye landmarks)
  useEffect(() => {
    if (!modelsLoaded || !cameraAllowed) return;

    let animationFrameId;

    const detectFace = async () => {
      if (webcamRef.current && webcamRef.current.readyState >= 3) {
        const detection = await faceapi.detectSingleFace(
          webcamRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        const isFacePresent = !!detection;
        setFaceDetected(isFacePresent);

        if (isFacePresent) {
          if (videoRef.current.paused && videoRef.current.readyState >= 3) {
            videoRef.current.play().catch(() => {});
          }
        } else {
          if (!videoRef.current.paused) {
            videoRef.current.pause();
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => cancelAnimationFrame(animationFrameId);
  }, [modelsLoaded, cameraAllowed]);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Smart Video Player 🎬</h2>
      {loadingMessage && <p>{loadingMessage}</p>}

      <video
        ref={videoRef}
        width="640"
        height="360"
        controls
        muted
        src="/video01.mp4"
        style={{ borderRadius: "10px", boxShadow: "0 0 10px gray" }}
      />

      <div style={{ marginTop: "20px" }}>
        <video
          ref={webcamRef}
          autoPlay
          muted
          width="300"
          height="200"
          style={{ borderRadius: "10px", border: "2px solid #333" }}
        />
        {cameraAllowed ? (
          <p style={{ fontStyle: "italic", color: faceDetected ? "green" : "red", fontWeight: "bold" }}>
            {faceDetected
              ? "✅ Face detected. Video playing."
              : "❌ No face detected. Video paused."}
          </p>
        ) : (
          <p style={{ color: "red" }}>
            Camera not allowed. Please enable camera permission.
          </p>
        )}
      </div>
    </div>
  );
}
