// src/SmartVideoPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function SmartVideoPlayer() {
  const videoRef = useRef(null); // Video player ref
  const webcamRef = useRef(null); // Webcam feed ref

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading models...");

  // Load face-api models from public/models folder
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // Public folder models path
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setLoadingMessage("");
        console.log("Models loaded");
      } catch (error) {
        console.error("Error loading models:", error);
        setLoadingMessage("Failed to load face detection models.");
      }
    };

    loadModels();
  }, []);

  // Request camera permission and start webcam stream
  useEffect(() => {
    if (modelsLoaded) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
            setCameraAllowed(true);
            setLoadingMessage("");
            console.log("Camera started");
          }
        })
        .catch((err) => {
          console.error("Camera permission denied or error:", err);
          setLoadingMessage("Camera access denied. Please allow camera to continue.");
          setCameraAllowed(false);
        });
    }
  }, [modelsLoaded]);

  // Face detection loop: play/pause video based on user's gaze
  useEffect(() => {
    if (!modelsLoaded || !cameraAllowed) return;

    const interval = setInterval(async () => {
      if (
        webcamRef.current &&
        webcamRef.current.readyState === 4 &&
        videoRef.current
      ) {
        try {
          const detection = await faceapi
            .detectSingleFace(webcamRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();

          console.log("Detection:", detection);

          if (detection) {
            const leftEye = detection.landmarks.getLeftEye();
            const rightEye = detection.landmarks.getRightEye();

            // Average Y position of eyes
            const avgEyeY = (leftEye[0].y + rightEye[3].y) / 2;
            const midY = webcamRef.current.videoHeight / 2;

            if (avgEyeY > midY + 30 || avgEyeY < midY - 80) {
              videoRef.current.pause(); // User looking away
              console.log("User looking away - video paused");
            } else {
              videoRef.current.play(); // User looking at screen
              console.log("User looking at screen - video playing");
            }
          } else {
            videoRef.current.pause(); // No face detected
            console.log("No face detected - video paused");
          }
        } catch (error) {
          console.error("Detection error:", error);
        }
      }
    }, 700); // Run every 0.7 seconds

    return () => clearInterval(interval);
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
        src="/video01.mp4"  // Ensure this file is in public folder
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
          <p style={{ fontStyle: "italic" }}>
            👀 Keep your eyes on the screen to play video.
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
