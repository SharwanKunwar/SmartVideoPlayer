// src/SmartVideoPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function SmartVideoPlayer() {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading models...");
  const [userLooking, setUserLooking] = useState(false);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
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

  // Start webcam stream
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

  // Face detection loop with requestAnimationFrame for instant response
  useEffect(() => {
    if (!modelsLoaded || !cameraAllowed) return;

    let animationFrameId;

    const detectFace = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.readyState === 4 &&
        videoRef.current
      ) {
        try {
          const detection = await faceapi
            .detectSingleFace(
              webcamRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 160,
                scoreThreshold: 0.5,
              })
            )
            .withFaceLandmarks();

          console.log("Detection result:", detection);

          if (detection) {
            const leftEye = detection.landmarks.getLeftEye();
            const rightEye = detection.landmarks.getRightEye();

            const avgEyeY = (leftEye[0].y + rightEye[3].y) / 2;
            const midY = webcamRef.current.videoHeight / 2;

            if (avgEyeY > midY + 30 || avgEyeY < midY - 80) {
              // Looking away - pause video if playing
              if (!videoRef.current.paused) videoRef.current.pause();
              setUserLooking(false);
              console.log("Looking away - video paused");
            } else {
              // Looking at screen - play video if paused
              if (videoRef.current.paused) {
                videoRef.current.play().catch(() => {});
              }
              setUserLooking(true);
              console.log("Looking at screen - video playing");
            }
          } else {
            // No face detected - pause video
            if (!videoRef.current.paused) videoRef.current.pause();
            setUserLooking(false);
            console.log("No face detected - video paused");
          }
        } catch (error) {
          console.error("Detection error:", error);
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
        src="/video01.mp4" // Make sure this file is in public folder
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
          <>
            {userLooking ? (
              <p style={{ fontStyle: "italic", color: "green" }}>
                👀 You are looking at the screen, video playing.
              </p>
            ) : (
              <p style={{ fontStyle: "italic", color: "red", fontWeight: "bold" }}>
                👀 Please look at the screen to play the video.
              </p>
            )}
          </>
        ) : (
          <p style={{ color: "red" }}>
            Camera not allowed. Please enable camera permission.
          </p>
        )}
      </div>
    </div>
  );
}
