import React, { useEffect, useRef } from 'react';

export default function CameraTest() {
  const videoRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert('Camera permission denied or not available.');
        console.error(err);
      }
    }
    startCamera();
  }, []);

  return (
    <div>
      <h2>Camera Permission Test</h2>
      <video ref={videoRef} width="320" height="240" autoPlay muted />
    </div>
  );
}
