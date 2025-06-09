import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceDetect() {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [eyesOpen, setEyesOpen] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // Ensure models exist here
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load models");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;

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
          setFaceDetected(true);
          const landmarks = detection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          const leftEAR = EAR(leftEye);
          const rightEAR = EAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;

          // Threshold to determine eye state
          setEyesOpen(avgEAR > 0.25); // Adjust threshold based on lighting/camera
        } else {
          setFaceDetected(false);
          setEyesOpen(null);
        }
      }

      animationFrameId = requestAnimationFrame(detect);
    };

    detect();

    return () => cancelAnimationFrame(animationFrameId);
  }, [modelsLoaded]);

  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <h2>Face + Eye Detection</h2>
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
          ? `Face: Detected ✅ | Eyes: ${
              eyesOpen === null ? "..." : eyesOpen ? "Open 👀" : "Closed 😴"
            }`
          : "Face Not Detected ❌"}
      </p>
    </div>
  );
}
