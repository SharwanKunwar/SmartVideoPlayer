import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function SmartVideoPlayer() {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading models...");

  // Load face detection models
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

  // Start webcam
  useEffect(() => {
    if (modelsLoaded) {
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
          console.error("Camera permission denied:", err);
          setLoadingMessage("Camera access denied. Please allow camera to continue.");
        });
    }
  }, [modelsLoaded]);

  // Face detection: auto play/pause based on gaze
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

          if (detection) {
            const leftEye = detection.landmarks.getLeftEye();
            const rightEye = detection.landmarks.getRightEye();

            const avgEyeY = (leftEye[0].y + rightEye[3].y) / 2;
            const midY = webcamRef.current.videoHeight / 2;

            const isLooking = avgEyeY < midY + 30 && avgEyeY > midY - 80;

            if (isLooking) {
              if (videoRef.current.paused) {
                await videoRef.current.play();
                console.log("👁️ Watching - Video playing");
              }
            } else {
              if (!videoRef.current.paused) {
                videoRef.current.pause();
                console.log("🙈 Looked away - Video paused");
              }
            }
          } else {
            if (!videoRef.current.paused) {
              videoRef.current.pause();
              console.log("🚫 No face detected - Video paused");
            }
          }
        } catch (error) {
          console.error("Detection error:", error);
        }
      }
    }, 700);

    return () => clearInterval(interval);
  }, [modelsLoaded, cameraAllowed]);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>🎥 Smart Video Player</h2>
      {loadingMessage && <p>{loadingMessage}</p>}

      <video
        ref={videoRef}
        width="640"
        height="360"
        controls  // <-- Controls kept here!
        muted
        autoPlay={false} // Remove autoplay to prevent conflict with controls
        playsInline
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
          <p style={{ fontStyle: "italic" }}>
            👁️ Stay focused on the screen to keep video playing.
          </p>
        ) : (
          <p style={{ color: "red" }}>
            🚫 Camera not allowed. Please allow camera permission.
          </p>
        )}
      </div>
    </div>
  );
}
