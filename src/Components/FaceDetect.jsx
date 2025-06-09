import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function EyeStateDetector() {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [eyesOpen, setEyesOpen] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Model loading error:", err);
        setErrorMessage("Failed to load models");
      }
    };
    loadModels();
  }, []);

  // Run Detection
  useEffect(() => {
    if (!modelsLoaded) return;

    let stream;
    let animationFrameId;

    const EAR = (eye) => {
      const vertical1 = faceapi.euclideanDistance(eye[1], eye[5]);
      const vertical2 = faceapi.euclideanDistance(eye[2], eye[4]);
      const horizontal = faceapi.euclideanDistance(eye[0], eye[3]);
      return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    const detect = async () => {
      if (videoRef.current?.readyState === 4) {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);

        if (detection) {
          const landmarks = detection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          const leftEAR = EAR(leftEye);
          const rightEAR = EAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;

          setEyesOpen(avgEAR > 0.22); // Adjusted threshold
        } else {
          setEyesOpen(null);
        }
      }

      animationFrameId = requestAnimationFrame(detect);
    };

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        detect();
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setErrorMessage("Camera access denied");
      });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [modelsLoaded]);

  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <h2>Eye Status</h2>
      <video
        ref={videoRef}
        width="320"
        height="240"
        muted
        style={{ border: "1px solid black", borderRadius: "8px" }}
      />
      <p style={{ marginTop: "1rem", fontSize: "1.2rem" }}>
        {errorMessage
          ? errorMessage
          : eyesOpen === null
          ? "Detecting..."
          : eyesOpen
          ? "Eyes Open 👀"
          : "Eyes Closed 😴"}
      </p>
    </div>
  );
}
