import { useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Camera, useCameraPermissions } from "expo-camera";
import Canvas from "react-native-canvas";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";
import { calcularAngulo } from "../utils/calc";

export default function PoseCamera({ exercise, onExit }) {
  const [cameraPermission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  const [counter, setCounter] = useState(0);
  const [stage, setStage] = useState("---");
  const [poseDetector, setPoseDetector] = useState(null);

  // Inicializar MediaPipe
  useEffect(() => {
    async function loadModel() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      const detector = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-assets/pose_landmarker_lite.task"
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      setPoseDetector(detector);
    }

    loadModel();
  }, []);

  // Loop da câmera
  const onCameraReady = async () => {
    setInterval(async () => {
      if (!cameraRef.current || !poseDetector) return;

      const frame = await cameraRef.current.takePictureAsync({
        base64: true,
      });

      const imageData = `data:image/jpg;base64,${frame.base64}`;

      await processFrame(imageData);

    }, 150);
  };

  const processFrame = async (imageData) => {
    const result = await poseDetector.detectAsync(imageData);
    const canvas = canvasRef.current;

    if (!canvas || !result?.landmarks) return;

    const ctx = canvas.getContext("2d");
    canvas.width = 400;
    canvas.height = 600;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawingUtils = new DrawingUtils(ctx);

    result.landmarks.forEach((landmarks) => {
      drawingUtils.drawLandmarks(landmarks);
      drawingUtils.drawConnectors(landmarks);
    });

    analisarExercicio(result.landmarks[0]);
  };

  // =====================================================
  // ANALISADOR (Rosca Direta / Agachamento)
  // =====================================================
  const analisarExercicio = (lm) => {
    if (!lm) return;

    if (exercise === "roscaDireta") {
      const a = lm[11]; // ombro
      const b = lm[13]; // cotovelo
      const c = lm[15]; // punho

      const ang = calcularAngulo(a, b, c);

      if (ang > 145) setStage("baixo");
      if (ang < 30 && stage === "baixo") {
        setStage("cima");
        setCounter((c) => c + 1);
      }
    }

    if (exercise === "meioAgachamento") {
      const L = {
        hip: lm[24],
        knee: lm[26],
        ankle: lm[28],
      };
      const R = {
        hip: lm[23],
        knee: lm[25],
        ankle: lm[27],
      };

      const angL = calcularAngulo(L.hip, L.knee, L.ankle);
      const angR = calcularAngulo(R.hip, R.knee, R.ankle);

      if (angL >= 170 && angR >= 170) setStage("baixo");
      if (angL <= 100 && angR <= 100 && stage === "baixo") {
        setStage("cima");
        setCounter((c) => c + 1);
      }
    }
  };

  if (!cameraPermission) return <View />;

  if (!cameraPermission.granted)
    return (
      <View>
        <Text style={{ color: "white", alignItems: "center" }}>É necessário permitir acesso à câmera.</Text>
        <Button title="Permitir" onPress={requestPermission} />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Camera
        style={{ flex: 1 }}
        type="front"
        ref={cameraRef}
        onCameraReady={onCameraReady}
      />

      <Canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      />

      <View style={styles.overlay}>
        <Text style={styles.text}>Repetições: {counter}</Text>
        <Text style={styles.text}>Estágio: {stage}</Text>

        <Button title="Sair" onPress={onExit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  text: {
    color: "#00ff00",
    fontSize: 20,
  }
});
